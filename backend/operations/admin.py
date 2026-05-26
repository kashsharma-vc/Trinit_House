from django.contrib import admin

from .models import PenaltyCase
@admin.register(PenaltyCase)
class PenaltyCaseAdmin(admin.ModelAdmin):
    list_display = ('id', 'vendor', 'zone', 'workshop', 'delayed', 'penaltyRisk', 'status', 'assignedTo')
    search_fields = ('id', 'vendor', 'workshop', 'assignedTo')
    list_filter = ('status', 'zone')

# admin.py snippet example
from django.contrib import admin
from .models import SOPStage, ChecklistItem

class ChecklistItemInline(admin.TabularInline):
    model = ChecklistItem
    extra = 0
    # Exclude completed_by and completed_at so Django sets them automatically in the background
    exclude = ['completed_by', 'completed_at'] 

@admin.register(SOPStage)
class SOPStageAdmin(admin.ModelAdmin):
    list_display = ['name', 'service_request', 'status', 'sequence']
    inlines = [ChecklistItemInline]

    def save_formset(self, request, form, formset, change):
        """Automatically stamp the logged-in technician's ID when they check an item"""
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, ChecklistItem) and instance.completed and not instance.completed_by:
                instance.completed_by = request.user
                # instance.completed_at = timezone.now() # if you import timezone
            instance.save()
        formset.save_m2m()