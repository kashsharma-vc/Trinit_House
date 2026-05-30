from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.utils import timezone
from django.db import transaction

from rest_framework import viewsets, status, parsers
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication, SessionAuthentication

from django.contrib.auth import get_user_model

from .models import ServiceRequest, SOPStage, ChecklistItem, Notification, PenaltyCase
from .serializers import (
    ServiceRequestSerializer,
    PenaltyCaseSerializer,
    ChecklistItemSerializer,
)

User = get_user_model()


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all().order_by("-id")
    serializer_class = ServiceRequestSerializer
    lookup_field = "request_id"

    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_superuser:
            return ServiceRequest.objects.filter(
                assigned_to__iexact=user.username
            ).order_by("-id")
        return ServiceRequest.objects.all().order_by("-id")

    @transaction.atomic
    def perform_create(self, serializer):
        request_obj = serializer.save()

        # Notify the assigned technician
        if request_obj.assigned_to:
            tech_user = User.objects.filter(
                username__iexact=request_obj.assigned_to
            ).first()
            if tech_user:
                compressor_name = request_obj.compressor.compressor_type if request_obj.compressor else "Compressor"
                Notification.objects.create(
                    user=tech_user,
                    message=f"New Task Assigned: {request_obj.request_id} ({compressor_name})"
                )
        # NOTE: SOP stages are automatically created by ServiceRequest.save()
        # using SOPStageTemplate records. No hardcoded stage creation here.

    @action(detail=True, methods=["post"], url_path="update_checklist")
    def update_checklist(self, request, request_id=None):
        service_request = self.get_object()

        stage_id = request.data.get("stage_id")
        item_id = request.data.get("item_id")
        completed_raw = request.data.get("completed", False)

        if not item_id:
            return Response(
                {"error": "Missing item_id parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )

        completed = str(completed_raw).lower() in ["true", "1", "yes", "on"]

        try:
            item_filter = {
                "id": item_id,
                "stage__service_request": service_request,
            }
            if stage_id:
                item_filter["stage_id"] = stage_id

            item = ChecklistItem.objects.get(**item_filter)
            item.completed = completed

            if completed:
                item.completed_by = request.user
                item.completed_at = timezone.now()
                item.labor_time = "15 mins"
            else:
                item.completed_by = None
                item.completed_at = None
                item.labor_time = None

            if "attachment" in request.FILES:
                item.attachment = request.FILES["attachment"]

            if completed and (item.requires_doc or item.requires_photo) and not item.attachment:
                return Response(
                    {"error": "Attachment is mandatory to complete this checklist item."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            item.save()

            current_stage = item.stage
            has_pending_items = ChecklistItem.objects.filter(
                stage=current_stage,
                completed=False
            ).exists()

            if not has_pending_items:
                current_stage.status = "completed"
                current_stage.save()

                next_stage = SOPStage.objects.filter(
                    service_request=service_request,
                    sequence__gt=current_stage.sequence
                ).order_by("sequence").first()

                if next_stage:
                    next_stage.status = "active"
                    next_stage.save()
                else:
                    service_request.status = "Closed"
                    service_request.save()
            else:
                current_stage.status = "active"
                current_stage.save()
                SOPStage.objects.filter(
                    service_request=service_request,
                    sequence__gt=current_stage.sequence
                ).update(status="pending")

            return Response(
                {"success": True, "message": "Checklist metric updated successfully"},
                status=status.HTTP_200_OK
            )

        except ChecklistItem.DoesNotExist:
            return Response(
                {"error": "Target checklist item not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class PenaltyCaseViewSet(viewsets.ModelViewSet):
    queryset = PenaltyCase.objects.all().order_by("-loggedDate")
    serializer_class = PenaltyCaseSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]


@api_view(["GET"])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def unread_count_view(request):
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({"count": count})


@api_view(["POST"])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def mark_as_read_view(request, notification_id):
    notification = get_object_or_404(Notification, id=notification_id, user=request.user)
    notification.is_read = True
    notification.save()
    return Response({"status": "success"})


@api_view(["GET"])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def notification_list_view(request):
    notifications = Notification.objects.filter(
        user=request.user,
        is_read=False
    ).order_by("-created_at")[:5]

    data = [
        {
            "id": n.id,
            "message": n.message,
            "created_at": n.created_at.strftime("%H:%M")
        }
        for n in notifications
    ]
    return Response({"notifications": data})


class ChecklistItemViewSet(viewsets.ModelViewSet):
    queryset = ChecklistItem.objects.all()
    serializer_class = ChecklistItemSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        was_completed_before = instance.completed

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_instance = serializer.save()

        if updated_instance.completed and not was_completed_before:
            updated_instance.completed_by = request.user
            updated_instance.completed_at = timezone.now()
            updated_instance.save()

            service_request = updated_instance.stage.service_request
            has_incomplete = ChecklistItem.objects.filter(
                stage__service_request=service_request,
                completed=False
            ).exists()

            if not has_incomplete:
                service_request.status = "Closed"
                service_request.save()

                admins = User.objects.filter(is_superuser=True)
                for admin in admins:
                    Notification.objects.create(
                        user=admin,
                        message=f"Technician {request.user.username} has completed all SOP stages for {service_request.request_id}."
                    )

        return Response(self.get_serializer(updated_instance).data)