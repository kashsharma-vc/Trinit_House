# serializers.py
from rest_framework import serializers
from .models import WarrantyCall

class WarrantyCallSerializer(serializers.ModelSerializer):
    # Keep read_only=True for dates to ensure they don't break validation
    loggedDate = serializers.DateField(format="%d %b %Y", read_only=True)
    slaDue = serializers.DateField(format="%d %b %Y", read_only=True)

    class Meta:
        model = WarrantyCall
        fields = '__all__'
        # This prevents DRF from complaining that 'id' is missing
        read_only_fields = ['id']