from rest_framework import serializers
from .models import WarrantyCall

class WarrantyCallSerializer(serializers.ModelSerializer):
    # Formats the dates so they look clean on the frontend (e.g., "28 Jan 2024")
    loggedDate = serializers.DateField(format="%d %b %Y", read_only=True)
    slaDue = serializers.DateField(format="%d %b %Y", read_only=True)

    class Meta:
        model = WarrantyCall
        fields = '__all__'