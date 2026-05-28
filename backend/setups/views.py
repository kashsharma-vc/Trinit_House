from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets
from .models import Role, Zone, Workshop, Category , Compressor , RoleAccessMapping
from .serializers import RoleSerializer, ZoneSerializer, WorkshopSerializer, CategorySerializer ,CompressorSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

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
            return Response({
                "token": token.key,
                "user": {"id": user.id, "username": user.username, "email": user.email,"is_superuser": user.is_superuser}
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

        user = User.objects.create_user(username=username, email=email, password=password)
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            "token": token.key,
            "user": {"id": user.id, "username": user.username, "email": user.email}
        }, status=status.HTTP_201_CREATED)
    
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
