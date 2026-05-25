from django.contrib import admin
from .models import InventoryItem

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    # CHANGED: 'compressor_type' -> 'compressor' AND 'location' -> 'workshop'
    list_display = ('sku', 'name', 'category', 'compressor', 'current_stock', 'safety_stock', 'workshop', 'vendor')
    
    # CHANGED: 'compressor_type' -> 'compressor' AND 'location' -> 'workshop'
    list_filter = ('category', 'compressor', 'workshop')
    
    search_fields = ('sku', 'name', 'vendor')