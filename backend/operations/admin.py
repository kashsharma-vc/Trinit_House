from django.contrib import admin

from .models import PenaltyCase
@admin.register(PenaltyCase)
class PenaltyCaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'vendor', 'zone', 'workshop', 'delayed', 'penaltyRisk', 'status', 'assignedTo')
    search_fields = ('id', 'vendor', 'workshop', 'assignedTo')
    list_filter = ('status', 'zone')