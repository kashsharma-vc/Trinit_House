import time
import json
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from setups.models import Role, Zone, RoleAccessMapping, UserProfile


@override_settings(
    VIBECONNECT_SSO_ENABLED=True,
    VIBECONNECT_CLIENT_ID="trinity-test-client",
    VIBECONNECT_CLIENT_SECRET="trinity-test-secret",
    VIBECONNECT_VALIDATE_URL="https://vibeconnect.example.com/api/sso/verify-code/",
    VIBECONNECT_EXPECTED_ISSUER="vibeconnect-auth",
    VIBECONNECT_SSO_TIMEOUT=2.0,
    VIBECONNECT_DEMO_USERNAME="demo_workshop_user",
)
class VibeConnectSSOTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()

        # Create role and zone
        self.zone = Zone.objects.create(zone_name="Test Zone")
        self.tech_role = Role.objects.create(role_name="Technician")
        self.admin_role = Role.objects.create(role_name="Admin")

        # Create RoleAccessMapping for technician
        self.mapping = RoleAccessMapping.objects.create(
            role=self.tech_role,
            site_id=str(self.zone.id),
            permissions={"operations:requests": {"view": True, "edit": False}}
        )

        # Create standard active approved user
        self.standard_user = User.objects.create_user(
            username="tech_john",
            email="john@example.com",
            password="SecurePassword123!",
            is_active=True,
            is_superuser=False,
            is_staff=False
        )
        self.profile = UserProfile.objects.create(
            user=self.standard_user,
            role="Technician",
            zone=self.zone
        )

        # Create inactive user (pending approval)
        self.inactive_user = User.objects.create_user(
            username="pending_jane",
            email="jane@example.com",
            password="SecurePassword123!",
            is_active=False
        )
        UserProfile.objects.create(user=self.inactive_user, role="Technician")

        # Create demo user
        self.demo_user = User.objects.create_user(
            username="demo_workshop_user",
            email="demo@example.com",
            password="DemoPassword123!",
            is_active=True,
            is_superuser=False,
            is_staff=False
        )
        UserProfile.objects.create(user=self.demo_user, role="Technician", zone=self.zone)

    def test_normal_login_remains_functional(self):
        """Standard username/password login must remain intact."""
        response = self.client.post("/api/setups/auth/login/", {
            "username": "tech_john",
            "password": "SecurePassword123!"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["username"], "tech_john")
        self.assertEqual(response.data["user"]["role"], "Technician")

    @patch("requests.post")
    def test_successful_sso_callback_with_approved_user(self, mock_post):
        """Valid code exchange maps to existing approved user and returns token."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": "john@example.com",
            "aud": "trinity-test-client",
            "iss": "vibeconnect-auth",
            "exp": time.time() + 60
        }
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "valid_auth_code_12345678",
            "state": "valid_state_param_12345678"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["email"], "john@example.com")
        self.assertEqual(response.data["user"]["role"], "Technician")
        self.assertEqual(response.data["user"]["is_superuser"], False)
        # Verify server-to-server call received correct secrets and code
        mock_post.assert_called_once()
        sent_payload = mock_post.call_args[1]["json"]
        sent_headers = mock_post.call_args[1]["headers"]
        self.assertEqual(sent_headers["Authorization"], "Bearer trinity-test-secret")
        self.assertEqual(sent_payload["client_identifier"], "trinity-test-client")
        self.assertEqual(sent_payload["code"], "valid_auth_code_12345678")

    @patch("requests.post")
    def test_sso_demo_launch_mapping(self, mock_post):
        """SSO launch flagged as demo maps to configured demo user."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "is_demo": True,
            "aud": "trinity-test-client",
            "iss": "vibeconnect-auth",
            "exp": time.time() + 60
        }
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "demo_launch_code_12345678",
            "state": "demo_launch_state_12345678"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["username"], "demo_workshop_user")

    @patch("requests.post")
    def test_cannot_escalate_to_superuser_or_admin_via_claims(self, mock_post):
        """Even if VibeConnect returns role='admin' or is_superuser=True, local DB permissions rule."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": "john@example.com",
            "role": "admin",
            "is_superuser": True,
            "aud": "trinity-test-client",
            "iss": "vibeconnect-auth",
            "exp": time.time() + 60
        }
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "admin_spoof_code_12345678",
            "state": "admin_spoof_state_12345678"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Must retain local user's actual attributes
        self.assertEqual(response.data["user"]["is_superuser"], False)
        self.assertEqual(response.data["user"]["role"], "Technician")

    def test_replay_attack_rejected(self):
        """A single authorization code cannot be submitted twice."""
        cache.clear()
        with patch("requests.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "email": "john@example.com",
                "aud": "trinity-test-client",
                "iss": "vibeconnect-auth",
                "exp": time.time() + 60
            }
            mock_post.return_value = mock_resp

            # First redemption succeeds
            res1 = self.client.post("/api/setups/auth/sso/callback/", {
                "code": "single_use_code_12345678",
                "state": "single_use_state_12345678"
            }, format="json")
            self.assertEqual(res1.status_code, status.HTTP_200_OK)

            # Replay redemption immediately rejected by replay cache
            res2 = self.client.post("/api/setups/auth/sso/callback/", {
                "code": "single_use_code_12345678",
                "state": "single_use_state_12345678"
            }, format="json")
            self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("already been redeemed", res2.data["error"])

    def test_state_replay_rejected(self):
        """A state nonce cannot be replayed."""
        cache.clear()
        with patch("requests.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "user": {"email": "john@example.com"},
                "audience": "trinity-test-client",
            }
            mock_post.return_value = mock_resp

            # First redemption
            res1 = self.client.post("/api/setups/auth/sso/callback/", {
                "code": "unique_code_1111111111",
                "state": "shared_state_nonce_12345"
            }, format="json")
            self.assertEqual(res1.status_code, status.HTTP_200_OK)

            # Different code, but reused state nonce -> rejected!
            res2 = self.client.post("/api/setups/auth/sso/callback/", {
                "code": "different_code_22222222",
                "state": "shared_state_nonce_12345"
            }, format="json")
            self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("state nonce has already been redeemed", res2.data["error"])

    @patch("requests.post")
    def test_vibeconnect_exact_nested_claims(self, mock_post):
        """Verifies parsing of the exact nested claims structure returned by VibeConnect."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "user": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "john@example.com",
                "full_name": "John Doe"
            },
            "organization": {"id": "org-1", "code": "default", "name": "Default Org"},
            "product": {"id": "prod-1", "code": "workshop", "name": "Trinity Workshop"},
            "assignment_id": "assign-1",
            "audience": "trinity-test-client"
        }
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "vibe_exact_code_12345678",
            "state": "vibe_exact_state_12345678"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["email"], "john@example.com")
        self.assertEqual(response.data["user"]["role"], "Technician")

    def test_malformed_code_and_state(self):
        """Codes that are too short, empty, or non-strings fail fast."""
        # Short code
        res1 = self.client.post("/api/setups/auth/sso/callback/", {"code": "short", "state": "valid_state_param_16"}, format="json")
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # State too short (< 16 chars)
        res2 = self.client.post("/api/setups/auth/sso/callback/", {"code": "valid_auth_code_12345678", "state": "short_state"}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("must be a secure token between 16 and 256 characters", res2.data["error"])

        # State with invalid/unsafe characters
        res3 = self.client.post("/api/setups/auth/sso/callback/", {"code": "valid_auth_code_12345678", "state": "invalid state with spaces!"}, format="json")
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("requests.post")
    def test_audience_mismatch_rejected(self, mock_post):
        """Mismatched audience claim must be rejected."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": "john@example.com",
            "aud": "wrong-client-id",
            "iss": "vibeconnect-auth"
        }
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "audience_mismatch_code_12",
            "state": "audience_mismatch_state_12"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("audience mismatch", response.data["error"])

    @patch("requests.post")
    def test_issuer_mismatch_rejected(self, mock_post):
        """Mismatched issuer claim must be rejected."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": "john@example.com",
            "aud": "trinity-test-client",
            "iss": "untrusted-issuer"
        }
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "issuer_mismatch_code_1234",
            "state": "issuer_mismatch_state_1234"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("issuer mismatch", response.data["error"])

    @patch("requests.post")
    def test_expired_token_rejected(self, mock_post):
        """Expired expiration timestamp in identity assertion must be rejected."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": "john@example.com",
            "aud": "trinity-test-client",
            "iss": "vibeconnect-auth",
            "exp": time.time() - 100  # in the past
        }
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "expired_assertion_code_12",
            "state": "expired_assertion_state_12"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("expired", response.data["error"])

    @patch("requests.post")
    def test_unapproved_user_rejected(self, mock_post):
        """User who has registered but is not active (pending admin approval) is rejected."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": "jane@example.com",
            "aud": "trinity-test-client",
            "iss": "vibeconnect-auth",
            "exp": time.time() + 60
        }
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "unapproved_user_code_1234",
            "state": "unapproved_user_state_1234"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("pending administrator approval", response.data["error"])

    @patch("requests.post")
    def test_nonexistent_user_rejected(self, mock_post):
        """Verified email that doesn't correspond to any user in Trinity is rejected."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": "unknown@example.com",
            "aud": "trinity-test-client",
            "iss": "vibeconnect-auth",
            "exp": time.time() + 60
        }
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "unknown_user_code_1234567",
            "state": "unknown_user_state_1234567"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("No active Trinity Workshop account", response.data["error"])

    @patch("requests.post")
    def test_verification_endpoint_timeout(self, mock_post):
        """Timeout in server-to-server request returns 504 Gateway Timeout."""
        import requests
        mock_post.side_effect = requests.exceptions.Timeout("Connection timed out")

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "timeout_test_code_12345678",
            "state": "timeout_test_state_12345678"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_504_GATEWAY_TIMEOUT)
        self.assertIn("timed out", response.data["error"])

    @patch("requests.post")
    def test_verification_endpoint_http_error(self, mock_post):
        """VibeConnect endpoint rejecting with HTTP 400/401 yields 401."""
        mock_resp = MagicMock()
        mock_resp.status_code = 401
        mock_resp.text = "Unauthorized"
        mock_post.return_value = mock_resp

        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "rejected_code_1234567890",
            "state": "rejected_state_1234567890"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(VIBECONNECT_SSO_ENABLED=False)
    def test_sso_disabled_behavior(self):
        """When SSO is disabled, callback immediately returns 403 Forbidden."""
        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "sso_disabled_code_123456",
            "state": "sso_disabled_state_123456"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("disabled", response.data["error"])

    @override_settings(VIBECONNECT_CLIENT_SECRET="")
    def test_missing_configuration_fails_closed(self):
        """Missing client secret fails closed with 500 error."""
        response = self.client.post("/api/setups/auth/sso/callback/", {
            "code": "missing_config_code_12345",
            "state": "missing_config_state_12345"
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
