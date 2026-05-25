from rest_framework import serializers
from .models import InventoryItem

class InventoryItemSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    
    # Mapped precisely to your setup model field names!
    cat_name = serializers.CharField(source='category.category_name', read_only=True)
    comp_name = serializers.CharField(source='compressor.compressor_type', read_only=True)
    work_name = serializers.CharField(source='workshop.workshop_name', read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'sku', 'name', 
            'category', 'cat_name', 
            'compressor', 'comp_name', 
            'workshop', 'work_name', 
            'vendor', 'current_stock', 'safety_stock', 'unit_price', 'status'
        ]