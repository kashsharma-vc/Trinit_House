from rest_framework import serializers
from .models import Role, Zone, Workshop, Category, Compressor, RoleAccessMapping
from .models import AppModule, AppFeature
from .models import SOPStageTemplate, ChecklistTemplate
from .models import UserProfile
from django.contrib.auth.models import User


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = '__all__'


class WorkshopSerializer(serializers.ModelSerializer):
    # We can add a read-only field to send the zone's name to the frontend
    zone_name = serializers.CharField(source='zone.zone_name', read_only=True)

    class Meta:
        model = Workshop
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class CompressorSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)

    class Meta:
        model = Compressor
        fields = '__all__'


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'role_name', 'description', 'status', 'created_on', 'created_by']


class RoleAccessMappingSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.role_name', read_only=True)

    class Meta:
        model = RoleAccessMapping
        fields = ['id', 'role', 'role_name', 'site_id', 'permissions']


class AppFeatureSerializer(serializers.ModelSerializer):
    key = serializers.CharField(source='feature_key', read_only=True)

    class Meta:
        model = AppFeature
        fields = ['id', 'feature_key', 'key', 'label', 'module']


class AppModuleSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name')
    items = AppFeatureSerializer(source='features', many=True, read_only=True)

    class Meta:
        model = AppModule
        fields = ['id', 'title', 'order', 'items']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'profile_picture', 'role']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_active', 'profile', 'role']

    def get_role(self, obj):
        if obj.is_superuser:
            return "Admin"
        if hasattr(obj, 'profile') and obj.profile and obj.profile.role:
            return obj.profile.role
        return "Technician"


class ChecklistTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistTemplate
        fields = '__all__'


class SOPStageTemplateSerializer(serializers.ModelSerializer):
    checklists = ChecklistTemplateSerializer(many=True, read_only=True)

    class Meta:
        model = SOPStageTemplate
        fields = '__all__'