from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

# Import Models
from .models import ServiceRequest, SOPStage, ChecklistItem, Notification, PenaltyCase

# Import Serializers
from .serializers import ServiceRequestSerializer, PenaltyCaseSerializer

class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all().order_by('-id')
    serializer_class = ServiceRequestSerializer
    lookup_field = 'request_id'

    def perform_create(self, serializer):
        request_obj = serializer.save()
        
        # Stage 1: Pre-Inspection
        s1 = SOPStage.objects.create(service_request=request_obj, name="Pre-Inspection", purpose="Ensure safety compliance", status="active", sequence=1)
        ChecklistItem.objects.create(stage=s1, text="Verify lifting points condition", attachment_label="Pre-lift photos")
        ChecklistItem.objects.create(stage=s1, text="Check lifting equipment certification", requires_doc=True)
        
        # Stage 2: Transit
        s2 = SOPStage.objects.create(service_request=request_obj, name="Transit", purpose="Ensure safe transport", status="pending", sequence=2)
        ChecklistItem.objects.create(stage=s2, text="Verify dispatch details", attachment_label="Dispatch document")
        
        # Stage 3: Receiving
        s3 = SOPStage.objects.create(service_request=request_obj, name="Receiving", purpose="Confirm item integrity on arrival", status="pending", sequence=3)
        ChecklistItem.objects.create(stage=s3, text="Verify delivery challan", requires_doc=True)
        ChecklistItem.objects.create(stage=s3, text="Inspect packaging condition", requires_photo=True)

        # Stage 4: Inspection
        s4 = SOPStage.objects.create(service_request=request_obj, name="Inspection", purpose="Identify faults and scope", status="pending", sequence=4)
        ChecklistItem.objects.create(stage=s4, text="Perform visual inspection", requires_photo=True)
        ChecklistItem.objects.create(stage=s4, text="Check leaks / abnormal noise")

        # Stage 5: Disassembly
        s5 = SOPStage.objects.create(service_request=request_obj, name="Disassembly", purpose="Safe dismantling", status="pending", sequence=5)
        ChecklistItem.objects.create(stage=s5, text="Disconnect electrical connections")
        ChecklistItem.objects.create(stage=s5, text="Tag and document removed parts", requires_doc=True)

        # Stage 6: Cleaning
        s6 = SOPStage.objects.create(service_request=request_obj, name="Cleaning", purpose="Prepare parts for inspection", status="pending", sequence=6)
        ChecklistItem.objects.create(stage=s6, text="Record cleaning liquid used")
        ChecklistItem.objects.create(stage=s6, text="Verify cleanliness", requires_photo=True)

        # Stage 7: Parts Inspection
        s7 = SOPStage.objects.create(service_request=request_obj, name="Parts Inspection", purpose="Decide Reuse/Repair/Replace", status="pending", sequence=7)
        ChecklistItem.objects.create(stage=s7, text="Measure dimensional tolerances", requires_doc=True)
        ChecklistItem.objects.create(stage=s7, text="Mark part decision (Reuse/Replace)")

        # Stage 8: Assembly
        s8 = SOPStage.objects.create(service_request=request_obj, name="Assembly", purpose="Restore equipment", status="pending", sequence=8)
        ChecklistItem.objects.create(stage=s8, text="Install correct spare parts")
        ChecklistItem.objects.create(stage=s8, text="Apply torque and lubrication")

        # Stage 9: Testing
        s9 = SOPStage.objects.create(service_request=request_obj, name="Testing", purpose="Ensure functional reliability", status="pending", sequence=9)
        ChecklistItem.objects.create(stage=s9, text="Execute functional tests")
        ChecklistItem.objects.create(stage=s9, text="Record performance readings", requires_doc=True)

        # Stage 10: QC Checklist
        s10 = SOPStage.objects.create(service_request=request_obj, name="QC Checklist", purpose="Audit and closure", status="pending", sequence=10)
        ChecklistItem.objects.create(stage=s10, text="Review inspection & test records", requires_doc=True)
        ChecklistItem.objects.create(stage=s10, text="Supervisor / QA approval")

    @action(detail=True, methods=['post'], url_path='update_checklist')
    def update_checklist(self, request, request_id=None):
        service_request = self.get_object()
        stage_id = request.data.get('stage_id')
        item_id = request.data.get('item_id')
        completed_str = request.data.get('completed')
        completed_by = request.data.get('completed_by', 'Technician')

        if not stage_id or not item_id:
            return Response({"error": "Missing stage_id or item_id parameters"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = ChecklistItem.objects.get(id=item_id, stage_id=stage_id, stage__service_request=service_request)
        except ChecklistItem.DoesNotExist:
            return Response({"error": "Target checklist item not found"}, status=status.HTTP_404_NOT_FOUND)

        is_completed = completed_str == 'true'
        item.completed = is_completed

        if is_completed:
            item.completed_by = completed_by
            item.completed_at = timezone.now()
            item.labor_time = "15 mins" # Can be sent dynamically from front-end stopwatch logic
        else:
            item.completed_by = None
            item.completed_at = None
            item.labor_time = None

        # --- MULTIPART FILE EVIDENCE HANDLER ---
        if 'attachment' in request.FILES:
            item.attachment = request.FILES['attachment']

        item.save()

        # Recalculate if parent stage is complete, and if so, unlock the next stage
        current_stage = item.stage
        has_pending_items = current_stage.checklist.filter(completed=False).exists()
        
        if not has_pending_items:
            current_stage.status = "completed"
            current_stage.save()
            
            # Auto-unlock next linear tracking phase stage 
            next_stage = SOPStage.objects.filter(
                service_request=service_request, 
                sequence__gt=current_stage.sequence
            ).order_by('sequence').first()
            
            if next_stage:
                next_stage.status = "active"
                next_stage.save()
        else:
            current_stage.status = "active"
            current_stage.save()

        return Response({"success": True, "message": "Checklist metric updated successfully"})


class PenaltyCaseViewSet(viewsets.ModelViewSet):
    queryset = PenaltyCase.objects.all().order_by('-loggedDate')
    serializer_class = PenaltyCaseSerializer


# --- NOTIFICATION VIEWS ---

def unread_count_view(request):
    # Count notifications that are not read
    count = Notification.objects.filter(is_read=False).count()
    return JsonResponse({'count': count})

def mark_as_read_view(request, notification_id):
    notification = get_object_or_404(Notification, id=notification_id)
    notification.is_read = True
    notification.save()
    return JsonResponse({'status': 'success'})

def notification_list_view(request):
    # Fetch the 5 most recent unread notifications
    notifications = Notification.objects.filter(is_read=False).order_by('-created_at')[:5]
    data = [
        {"id": n.id, "message": n.message, "created_at": n.created_at.strftime("%H:%M")} 
        for n in notifications
    ]
    return JsonResponse({'notifications': data})

from rest_framework import viewsets, parsers, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChecklistItem
from .serializers import ChecklistItemSerializer
from django.utils import timezone

class ChecklistItemViewSet(viewsets.ModelViewSet):
    queryset = ChecklistItem.objects.all()
    serializer_class = ChecklistItemSerializer
    
    # Ensure only logged-in users (Technicians/Admins) can access this
    permission_classes = [IsAuthenticated] 
    
    # Allow Django to accept the file uploads from React's FormData
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def update(self, request, *args, **kwargs):
        """
        Intercept the update call from the React Technician Dashboard.
        Automatically tag the logged-in technician as the person who completed it.
        """
        instance = self.get_object()
        
        # We only want to set completed_by if it wasn't already completed
        was_completed_before = instance.completed
        
        # Use partial=True so the frontend doesn't have to send every single field
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Save the new data (images, notes, etc.)
        updated_instance = serializer.save()

        # If the frontend just marked this as "completed", record the user and time
        if updated_instance.completed and not was_completed_before:
            updated_instance.completed_by = request.user
            updated_instance.completed_at = timezone.now()
            updated_instance.save()
            
        return Response(serializer.data)