from rest_framework import serializers
from .models import ChecklistItem, SOPStage, ServiceRequest

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

# In operations/serializers.py
class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = '__all__'

class SOPStageSerializer(serializers.ModelSerializer):
    checklist = ChecklistItemSerializer(many=True, read_only=True) # Nests the checklist

    class Meta:
        model = SOPStage
        fields = '__all__'

class ServiceRequestSerializer(serializers.ModelSerializer):
    # Grab the readable names from the linked models
    zone_name = serializers.CharField(source='zone.zone_name', read_only=True)
    workshop_name = serializers.CharField(source='workshop.workshop_name', read_only=True)
    compressor_type = serializers.CharField(source='compressor.compressor_type', read_only=True)
    
    # 🟢 REMOVE the old stages line and REPLACE with this method field to guarantee order
    stages = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = '__all__'

    # 🟢 THIS GUARANTEES STAGES GO IN PERFECT LINEAR SEQUENCE FROM 1 TO 10
    def get_stages(self, instance):
        ordered_stages = instance.stages.all().order_by('sequence')
        return SOPStageSerializer(ordered_stages, many=True, context=self.context).data