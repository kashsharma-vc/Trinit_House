from rest_framework import serializers
from .models import Invoice, Penalty

class InvoiceSerializer(serializers.ModelSerializer):
    # Pull readable data from the linked ServiceRequest
    job_request_id = serializers.CharField(source='job_code.request_id', read_only=True)
    zone_name = serializers.CharField(source='job_code.zone.zone_name', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'

class PenaltySerializer(serializers.ModelSerializer):
    job_request_id = serializers.CharField(source='job_code.request_id', read_only=True)
    zone_name = serializers.CharField(source='job_code.zone.zone_name', read_only=True)
    workshop_name = serializers.CharField(source='job_code.workshop.workshop_name', read_only=True)

    class Meta:
        model = Penalty
        fields = '__all__'