from rest_framework import serializers
from .models import ServiceRequest

class ServiceRequestSerializer(serializers.ModelSerializer):
    # Grab the readable names from the linked models
    zone_name = serializers.CharField(source='zone.zone_name', read_only=True)
    workshop_name = serializers.CharField(source='workshop.workshop_name', read_only=True)
    compressor_type = serializers.CharField(source='compressor.compressor_type', read_only=True)

    class Meta:
        model = ServiceRequest
        fields = '__all__' # Sends all model fields plus the 3 custom ones above

from .models import PenaltyCase

class PenaltyCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PenaltyCase
        fields = '__all__'