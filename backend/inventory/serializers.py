from rest_framework import serializers
from .models import InventoryItem

class InventoryItemSerializer(serializers.ModelSerializer):
    # This ensures our calculated property is sent to React
    status = serializers.ReadOnlyField()
    # This sends the actual category name instead of just the ID number
    category_name = serializers.CharField(source='category.category_name', read_only=True)

    class Meta:
        model = InventoryItem
        fields = ['id', 'name', 'category', 'category_name', 'compressor_type', 
                  'current_stock', 'safety_stock', 'vendor', 'status']