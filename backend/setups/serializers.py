from rest_framework import serializers
from .models import Role, Zone, Workshop, Category , Compressor

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__' # This automatically grabs id, role_name, status, created_on, etc.

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
        fields = '__all__' # changes 


class CompressorSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)

    class Meta:
        model = Compressor
        fields = '__all__'


from .models import Role, RoleAccessMapping

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'role_name', 'description']

class RoleAccessMappingSerializer(serializers.ModelSerializer):

    role_name = serializers.CharField(source='role.role_name', read_only=True)
    class Meta:
        model = RoleAccessMapping
        fields = ['id', 'role', 'role_name' ,'site_id', 'permissions']