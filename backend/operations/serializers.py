from rest_framework import serializers
from .models import ChecklistItem, SOPStage, ServiceRequest, PenaltyCase

class PenaltyCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PenaltyCase
        fields = '__all__'

class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = '__all__'

class SOPStageSerializer(serializers.ModelSerializer):
    checklist = ChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = SOPStage
        fields = '__all__'

class ServiceRequestSerializer(serializers.ModelSerializer):
    zone_name = serializers.SerializerMethodField()
    workshop_name = serializers.SerializerMethodField()
    compressor_type = serializers.SerializerMethodField()
    stages = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = '__all__'

    def get_zone_name(self, obj):
        return obj.zone.zone_name if obj.zone else "Unassigned"

    def get_workshop_name(self, obj):
        return obj.workshop.workshop_name if obj.workshop else "Unassigned"

    def get_compressor_type(self, obj):
        return obj.compressor.compressor_type if obj.compressor else "Unknown"

    def get_stages(self, instance):
        ordered_stages = instance.stages.all().order_by('sequence')
        return SOPStageSerializer(ordered_stages, many=True).data

    def to_internal_value(self, data):
        # Create a mutable copy of the incoming data
        mutable_data = data.copy()
        
        # Safely map frontend IDs and convert empty strings to None (null)
        if 'zone_id' in mutable_data:
            val = mutable_data.pop('zone_id')
            mutable_data['zone'] = val if val else None
            
        if 'workshop_id' in mutable_data:
            val = mutable_data.pop('workshop_id')
            mutable_data['workshop'] = val if val else None
            
        if 'compressor_id' in mutable_data:
            val = mutable_data.pop('compressor_id')
            mutable_data['compressor'] = val if val else None
            
        return super().to_internal_value(mutable_data)