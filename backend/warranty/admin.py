from django.contrib import admin
from .models import WarrantyCall

@admin.register(WarrantyCall)
class WarrantyCallAdmin(admin.ModelAdmin):
    # This controls what columns show up in the admin list view
    list_display = ('id', 'equipment', 'vendor', 'status', 'stage', 'warrantyStatus')
    
    # Adds a search bar to the admin panel
    search_fields = ('id', 'equipment', 'vendor', 'serial')
    
    # Adds filter sidebar
    list_filter = ('status', 'stage', 'warrantyStatus')