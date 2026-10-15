import os
import time
import hashlib
import logging
import requests
from django.conf import settings
from django.core.cache import cache
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import Role, RoleAccessMapping

logger = logging.getLogger(__name__)

# Maximum allowed lengths for validation
MAX_CODE_LENGTH = 512
MAX_STATE_LENGTH = 256
MIN_CODE_LENGTH = 8
MIN_STATE_LENGTH = 8


class VibeConnectSSOCallbackView(APIView):
    """
    Secure server-to-server SSO callback endpoint.
    Exchanges a single-use authorization code from VibeConnect for an
    authenticated Trinity Workshop session.
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        # 1. Check if SSO is enabled
        if not getattr(settings, "VIBECONNECT_SSO_ENABLED", False):
            return Response(
                {"error": "Single Sign-On is currently disabled on this instance."},
                status=status.HTTP_403_FORBIDDEN
            )

        client_id = getattr(settings, "VIBECONNECT_CLIENT_ID", "")
        client_secret = getattr(settings, "VIBECONNECT_CLIENT_SECRET", "")
        validate_url = getattr(settings, "VIBECONNECT_VALIDATE_URL", "")
        timeout = getattr(settings, "VIBECONNECT_SSO_TIMEOUT", 5.0)
        expected_issuer = getattr(settings, "VIBECONNECT_EXPECTED_ISSUER", "")
        demo_username = getattr(settings, "VIBECONNECT_DEMO_USERNAME", "demo_user")

        if not client_id or not client_secret or not validate_url:
            logger.error("SSO configuration incomplete (missing client_id, client_secret, or validate_url).")
            return Response(
                {"error": "SSO service is not properly configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # In production (non-DEBUG), enforce HTTPS
        if not settings.DEBUG and not validate_url.startswith("https://"):
            logger.error("Insecure SSO validate_url configured in production mode.")
            return Response(
                {"error": "SSO configuration error: Insecure endpoint rejected."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 2. Validate request parameters
        code = request.data.get("code")
        state = request.data.get("state")

        if not isinstance(code, str) or not isinstance(state, str):
            return Response(
                {"error": "Both 'code' and 'state' must be valid strings."},
                status=status.HTTP_400_BAD_REQUEST
            )

        code = code.strip()
        state = state.strip()

        if len(code) < MIN_CODE_LENGTH or len(code) > MAX_CODE_LENGTH:
            return Response(
                {"error": "Invalid authorization code length."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate state format, character set, and minimum entropy (meaningful CSRF binding)
        import re
        if not re.match(r"^[A-Za-z0-9_\-\.]{16,256}$", state):
            return Response(
                {"error": "Invalid state parameter: must be a secure token between 16 and 256 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Local Replay Protection (Single-use burning of both code and state)
        code_hash = hashlib.sha256(code.encode("utf-8")).hexdigest()
        code_cache_key = f"sso_code_burn_{code_hash}"
        is_first_use = cache.add(code_cache_key, "burned", timeout=300)
        if not is_first_use:
            logger.warning("Replay attempt detected for authorization code hash %s...", code_hash[:8])
            return Response(
                {"error": "Authorization code has already been redeemed or has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

        state_hash = hashlib.sha256(state.encode("utf-8")).hexdigest()
        state_cache_key = f"sso_state_burn_{state_hash}"
        is_state_first_use = cache.add(state_cache_key, "burned", timeout=300)
        if not is_state_first_use:
            logger.warning("Replay attempt detected for state nonce hash %s...", state_hash[:8])
            return Response(
                {"error": "SSO state nonce has already been redeemed or has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Server-to-server exchange with VibeConnect backend
        # VibeConnect expects Authorization: Bearer <client_secret>
        exchange_payload = {
            "code": code,
            "client_identifier": client_id,
            "client_id": client_id,
            "state": state,
        }
        exchange_headers = {
            "Authorization": f"Bearer {client_secret}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "TrinityWorkshop-SSO/1.0"
        }

        try:
            resp = requests.post(
                validate_url,
                json=exchange_payload,
                headers=exchange_headers,
                timeout=timeout
            )
        except requests.exceptions.Timeout:
            logger.warning("Timeout contacting VibeConnect SSO validation endpoint.")
            return Response(
                {"error": "SSO verification service timed out. Please try standard login."},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.exceptions.RequestException as exc:
            logger.warning("Network failure contacting VibeConnect SSO validation endpoint: %s", type(exc).__name__)
            return Response(
                {"error": "SSO verification service is currently unavailable."},
                status=status.HTTP_502_BAD_GATEWAY
            )

        if resp.status_code != 200:
            logger.warning("VibeConnect SSO validation rejected code with status %s", resp.status_code)
            return Response(
                {"error": "Invalid or expired authorization code."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            identity_data = resp.json()
        except ValueError:
            logger.error("VibeConnect SSO validation endpoint returned non-JSON response.")
            return Response(
                {"error": "Malformed response from SSO provider."},
                status=status.HTTP_502_BAD_GATEWAY
            )

        if not isinstance(identity_data, dict):
            return Response(
                {"error": "Invalid identity payload structure."},
                status=status.HTTP_502_BAD_GATEWAY
            )

        # 5. Cryptographic / Protocol Assertions
        # Audience verification (VibeConnect returns "audience" claim)
        aud = identity_data.get("audience") or identity_data.get("aud") or identity_data.get("client_id")
        if aud and aud != client_id:
            logger.warning("SSO audience mismatch: expected %s, got %s", client_id, aud)
            return Response(
                {"error": "SSO assertion audience mismatch."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Issuer verification (if configured and provided)
        iss = identity_data.get("iss")
        if expected_issuer and iss and iss != expected_issuer:
            logger.warning("SSO issuer mismatch: expected %s, got %s", expected_issuer, iss)
            return Response(
                {"error": "SSO assertion issuer mismatch."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Expiry verification (if provided)
        exp = identity_data.get("exp")
        if exp is not None:
            try:
                if time.time() > float(exp):
                    return Response(
                        {"error": "SSO assertion has expired."},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid expiration claim in SSO assertion."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        # 6. Secure User Mapping & Authorization
        # Extract verified user from VibeConnect payload (nested under "user" dict or top-level)
        user_info = identity_data.get("user")
        if isinstance(user_info, dict):
            verified_email = user_info.get("email")
            verified_username = user_info.get("username")
        else:
            verified_email = identity_data.get("email")
            verified_username = identity_data.get("username")

        is_demo_launch = (
            identity_data.get("is_demo") is True or
            identity_data.get("demo") is True or
            (isinstance(user_info, dict) and user_info.get("is_demo") is True)
        )

        user = None

        # A) Explicit Demo user launch mapping
        if is_demo_launch:
            user = User.objects.filter(username=demo_username, is_active=True).first()
            if not user and verified_email:
                user = User.objects.filter(email__iexact=verified_email, is_active=True).first()
        else:
            # B) Existing active approved user mapping by verified email or username
            if verified_email:
                user = User.objects.filter(email__iexact=verified_email).first()
            if not user and verified_username:
                user = User.objects.filter(username=verified_username).first()

        if not user:
            logger.info("SSO identity could not be mapped to any existing Trinity user.")
            return Response(
                {"error": "No active Trinity Workshop account is linked to this VibeConnect identity. Please contact an administrator."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check account status
        if not user.is_active:
            return Response(
                {"error": "Your account is pending administrator approval or has been deactivated."},
                status=status.HTTP_403_FORBIDDEN
            )

        # CRITICAL SAFETY: Under NO circumstance do we modify user.is_superuser
        # or escalate privileges from an incoming SSO payload. The user's role
        # and permissions in Trinity Workshop remain authoritative.

        # 7. Establish Trinity Workshop Session
        token, _ = Token.objects.get_or_create(user=user)

        role_name = ""
        zone_id = None
        zone_name = ""
        permissions = {}

        if hasattr(user, "profile") and user.profile:
            role_name = user.profile.role or ""
            if user.profile.zone:
                zone_id = user.profile.zone.id
                zone_name = user.profile.zone.zone_name

        if role_name and zone_id:
            try:
                role_obj = Role.objects.get(role_name=role_name)
                mapping = RoleAccessMapping.objects.filter(role=role_obj, site_id=str(zone_id)).first()
                if mapping and mapping.permissions:
                    permissions = mapping.permissions
            except Exception as exc:
                logger.warning("Could not load permissions for user %s: %s", user.id, str(exc))

        # Return identical shape to LoginView
        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_superuser": user.is_superuser,
                "role": role_name,
                "zone_id": zone_id,
                "zone_name": zone_name,
                "permissions": permissions
            }
        }, status=status.HTTP_200_OK)
