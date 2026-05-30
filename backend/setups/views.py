from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets
from .models import Role, Zone, Workshop, Category, Compressor, RoleAccessMapping, UserProfile
from .serializers import RoleSerializer, ZoneSerializer, WorkshopSerializer, CategorySerializer, CompressorSerializer
from django.core.mail import send_mail
from django.conf import settings
from operations.models import Notification

from rest_framework.permissions import BasePermission

class IsSuperUserOrStaff(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_superuser or request.user.is_staff))

class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer

class WorkshopViewSet(viewsets.ModelViewSet):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

from django.http import HttpResponse

class CompressorViewSet(viewsets.ModelViewSet):
    queryset = Compressor.objects.all()
    serializer_class = CompressorSerializer


from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Role, RoleAccessMapping
from .serializers import RoleSerializer, RoleAccessMappingSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

class RoleAccessMappingViewSet(viewsets.ModelViewSet):
    queryset = RoleAccessMapping.objects.all()
    serializer_class = RoleAccessMappingSerializer

    # 1. PROACTIVE FIX: Tell Django how to filter by the URL parameters!
    def get_queryset(self):
        queryset = super().get_queryset()
        site_id = self.request.query_params.get('site_id')
        role_id = self.request.query_params.get('role')
        
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        if role_id:
            queryset = queryset.filter(role_id=role_id)
            
        return queryset
    # Custom endpoint to quickly get or create a mapping for a specific site & role
    @action(detail=False, methods=['post'])
    def sync_mapping(self, request):
        import json
        from django.db.models import JSONField

        role_id = request.data.get('role_id')
        zone_id = request.data.get('zone_id')
        permissions_data = request.data.get('permissions', {})

        if not role_id or not zone_id:
            return Response(
                {"error": "role_id and zone_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 1. Crash Prevention: If permissions is a TextField instead of a JSONField,
            # we must convert the dictionary into a JSON string before saving it.
            permissions_field = RoleAccessMapping._meta.get_field('permissions')
            if not isinstance(permissions_field, JSONField):
                permissions_data = json.dumps(permissions_data)

            # 2. EXACT SCHEMA MATCH: Based on your error log, your database uses 
            # 'role_id' and 'site_id'. We will map 'zone_id' straight into 'site_id'.
            mapping, created = RoleAccessMapping.objects.update_or_create(
                role_id=role_id,
                site_id=zone_id,
                defaults={'permissions': permissions_data}
            )

            return Response({
                "message": "Mapping synced successfully", 
                "created": created
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # This prints the exact reason for the error in your Django terminal console
            print(f"ERROR IN SYNC MAPPING: {str(e)}") 
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

class LoginView(APIView):
    permission_classes = [] # Allow anyone to access this

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            
            role_name = ""
            zone_id = None
            zone_name = ""
            permissions = {}
            if hasattr(user, 'profile'):
                role_name = user.profile.role or ""
                if user.profile.zone:
                    zone_id = user.profile.zone.id
                    zone_name = user.profile.zone.zone_name
            
            if role_name and zone_id:
                try:
                    from .models import Role, RoleAccessMapping
                    role_obj = Role.objects.get(role_name=role_name)
                    mapping = RoleAccessMapping.objects.filter(role=role_obj, site_id=str(zone_id)).first()
                    if mapping:
                        permissions = mapping.permissions
                except Exception as e:
                    print("Error loading permissions:", str(e))

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
            })
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class RegisterView(APIView):
    permission_classes = [] # Allow anyone to access this

    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Create user but mark as inactive (pending approval)
        user = User.objects.create_user(username=username, email=email, password=password, is_active=False)
        UserProfile.objects.create(user=user)

        # Notify admins
        admin_users = User.objects.filter(is_superuser=True)
        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                message=f"New user registration requires approval: {username} ({email})"
            )
        
        return Response({
            "message": "Registration successful. Please wait for an administrator to approve your account.",
            "user": {"id": user.id, "username": user.username, "email": user.email, "is_active": user.is_active}
        }, status=status.HTTP_201_CREATED)

class ForgotPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            profile, _ = UserProfile.objects.get_or_create(user=user)
            
            # Generate 6-digit OTP
            import random
            from django.utils import timezone
            otp = str(random.randint(100000, 999999))
            profile.otp_code = otp
            profile.otp_created_at = timezone.now()
            profile.save()

            # Print loudly to the terminal for local testing
            print("\n" + "="*60)
            print(f" 🔔 YOUR OTP FOR PASSWORD RESET IS: {otp} 🔔")
            print("="*60 + "\n")

            # Send Email
            subject = "Trinity House - Password Reset OTP"
            message = f"Your OTP for password reset is: {otp}\n\nThis OTP is valid for 10 minutes."
            from_email = settings.DEFAULT_FROM_EMAIL
            try:
                send_mail(subject, message, from_email, [email], fail_silently=True)
            except Exception as e:
                print(f"Warning: Could not send email via SMTP ({e})")

            return Response({"message": "OTP generated successfully. Check your terminal if email is disabled.", "debug_otp": otp})
        except User.DoesNotExist:
            # We return a success message even if the user is not found to prevent email enumeration
            return Response({"message": "If that email exists in our system, an OTP has been sent."})
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTPAndResetPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        from django.utils import timezone
        email = request.data.get("email")
        otp = request.data.get("otp")
        new_password = request.data.get("new_password")

        if not all([email, otp, new_password]):
            return Response({"error": "Email, OTP, and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            profile = user.profile
            
            if profile.otp_code != otp:
                return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check expiration (10 minutes)
            if profile.otp_created_at and (timezone.now() - profile.otp_created_at).total_seconds() > 600:
                return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Reset password
            user.set_password(new_password)
            user.save()
            
            # Clear OTP
            profile.otp_code = None
            profile.otp_created_at = None
            profile.save()
            
            return Response({"message": "Password reset successfully. You can now login."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except UserProfile.DoesNotExist:
            return Response({"error": "User profile not found."}, status=status.HTTP_404_NOT_FOUND)

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

class ProfileUpdateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def patch(self, request):
        user = request.user
        
        # Update User fields
        first_name = request.data.get('first_name')
        if first_name is not None:
            user.first_name = first_name
        
        last_name = request.data.get('last_name')
        if last_name is not None:
            user.last_name = last_name
            
        user.save()

        # Update UserProfile fields
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        phone_number = request.data.get('phone_number')
        if phone_number is not None:
            profile.phone_number = phone_number
            
        profile_picture = request.FILES.get('profile_picture')
        if profile_picture:
            profile.profile_picture = profile_picture
            
        profile.save()
        
        # Return updated user info matching our UserSerializer format
        return Response({
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile": {
                    "phone_number": profile.phone_number,
                    "profile_picture": request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None
                }
            }
        })
    
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User

class TechnicianListView(APIView):
    def get(self, request):
        # Fetch all non-admin users to populate the assignment dropdown
        techs = User.objects.filter(is_superuser=False).values('id', 'username')
        return Response(techs)
    
from rest_framework import viewsets
from .models import AppModule
from .serializers import AppModuleSerializer # Create this to include nested features

from .models import AppModule, AppFeature
from .serializers import AppModuleSerializer, AppFeatureSerializer

class AppFeatureViewSet(viewsets.ModelViewSet):
    queryset = AppFeature.objects.all()
    serializer_class = AppFeatureSerializer

class FeatureMasterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AppModule.objects.prefetch_related('features').all().order_by('order')
    serializer_class = AppModuleSerializer

    def list(self, request, *args, **kwargs):
        # Auto-seed the default data if the database is completely empty
        if not AppModule.objects.exists():
            self._seed_defaults()
        return super().list(request, *args, **kwargs)

    def _seed_defaults(self):
        defaults = [
            {"id": "core", "title": "Core Features", "items": [{"key": "my_tickets", "label": "My Tickets"}, {"key": "staff", "label": "Staff Management"}, {"key": "communication", "label": "Communications"}, {"key": "vendors", "label": "Vendor Management"}]},
            {"id": "operations", "title": "Operations", "items": [{"key": "bookings", "label": "Facility Bookings"}, {"key": "visitor_mgmt", "label": "Visitor Management"}, {"key": "incidents", "label": "Incident Reporting"}, {"key": "work_order", "label": "Work Orders"}, {"key": "gatepass", "label": "Gate Pass"}]},
            {"id": "financial", "title": "Financial & Accounts", "items": [{"key": "accounting", "label": "Accounting"}, {"key": "bills", "label": "Billing & Invoicing"}]},
            {"id": "hr", "title": "Human Resources", "items": [{"key": "attendance", "label": "Attendance"}, {"key": "hrms", "label": "HRMS"}]},
            {"id": "site_setup", "title": "System Setup", "items": [{"key": "setup_tickets", "label": "Ticket Configurations"}, {"key": "setup_incidents", "label": "Incident Configurations"}]}
        ]
        
        for order, mod in enumerate(defaults):
            module_obj = AppModule.objects.create(name=mod['title'], order=order)
            for item in mod['items']:
                AppFeature.objects.create(module=module_obj, feature_key=item['key'], label=item['label'])

from .serializers import UserSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A simple ViewSet for viewing users.
    """
    queryset = User.objects.all().select_related('profile')
    serializer_class = UserSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

class UserApprovalViewSet(viewsets.ViewSet):
    """
    Admin-only viewset to list pending users and approve/decline them.
    """
    permission_classes = [IsAuthenticated, IsSuperUserOrStaff]

    @action(detail=False, methods=['get'])
    def pending(self, request):
        users = User.objects.filter(is_active=False)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk, is_active=False)
            user.is_active = True
            
            # Check if admin assigned a specific role and zone
            role_name = request.data.get('role')
            zone_id = request.data.get('zone_id')
            
            if role_name or zone_id:
                profile, _ = UserProfile.objects.get_or_create(user=user)
                if role_name:
                    profile.role = role_name
                if zone_id:
                    try:
                        from .models import Zone
                        zone_obj = Zone.objects.get(id=zone_id)
                        profile.zone = zone_obj
                    except Exception:
                        pass
                profile.save()
                
                # If role is Admin, give them superuser privileges
                if role_name and role_name.lower() == 'admin':
                    user.is_superuser = True
                    user.is_staff = True
                elif role_name:
                    user.is_superuser = False
                    user.is_staff = False
            
            user.save()
            
            # Optionally send an email that account is approved
            if user.email:
                try:
                    send_mail(
                        "Trinity House - Account Approved",
                        "Your account has been approved by an administrator. You can now log in.",
                        settings.DEFAULT_FROM_EMAIL,
                        [user.email],
                        fail_silently=True
                    )
                except Exception:
                    pass

            return Response({"message": "User approved successfully."})
        except User.DoesNotExist:
            return Response({"error": "User not found or already approved."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk, is_active=False)
            user.delete() # Or keep them and add an is_declined flag, but deleting is simpler for now.
            return Response({"message": "User registration declined and removed."})
        except User.DoesNotExist:
            return Response({"error": "User not found or already approved."}, status=status.HTTP_404_NOT_FOUND)

from .serializers import SOPStageTemplateSerializer, ChecklistTemplateSerializer
from .models import SOPStageTemplate, ChecklistTemplate

class SOPStageTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUserOrStaff]
    queryset = SOPStageTemplate.objects.all().order_by('sequence')
    serializer_class = SOPStageTemplateSerializer

    def list(self, request, *args, **kwargs):
        if not SOPStageTemplate.objects.exists():
            self._seed_defaults()
        return super().list(request, *args, **kwargs)

    def _seed_defaults(self):
        defaults = [
            {"name": "Pre-Inspection", "purpose": "Initial visual check before movement.", "sequence": 1, "applicable_request_type": ""},
            {"name": "Transit", "purpose": "Transporting the equipment.", "sequence": 2, "applicable_request_type": ""},
            {"name": "Receiving", "purpose": "Receiving at the facility and logging.", "sequence": 3, "applicable_request_type": ""},
            {"name": "Inspection", "purpose": "Detailed inspection of the received item.", "sequence": 4, "applicable_request_type": ""},
            {"name": "Disassembly", "purpose": "Taking the equipment apart.", "sequence": 5, "applicable_request_type": ""},
            {"name": "Cleaning", "purpose": "Cleaning parts before further processing.", "sequence": 6, "applicable_request_type": ""},
            {"name": "Parts Inspection", "purpose": "Inspecting individual disassembled parts.", "sequence": 7, "applicable_request_type": ""},
            {"name": "Assembly", "purpose": "Reassembling the equipment.", "sequence": 8, "applicable_request_type": ""},
            {"name": "Testing", "purpose": "Running tests to ensure functionality.", "sequence": 9, "applicable_request_type": ""},
            {"name": "QC Checklist", "purpose": "Final quality control checks before closure.", "sequence": 10, "applicable_request_type": ""}
        ]
        for item in defaults:
            SOPStageTemplate.objects.create(**item)

class ChecklistTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSuperUserOrStaff]
    queryset = ChecklistTemplate.objects.all()
    serializer_class = ChecklistTemplateSerializer
