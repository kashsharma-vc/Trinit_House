from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import ServiceRequest
from .serializers import ServiceRequestSerializer

class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    lookup_field = 'request_id' 

from django.http import JsonResponse
from .models import Notification

def unread_count_view(request):
    # Count notifications that are not read
    count = Notification.objects.filter(is_read=False).count()
    return JsonResponse({'count': count})


from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from .models import Notification

def mark_as_read_view(request, notification_id):
    notification = get_object_or_404(Notification, id=notification_id)
    notification.is_read = True
    notification.save()
    return JsonResponse({'status': 'success'})

from django.http import JsonResponse
from .models import Notification

def notification_list_view(request):
    # Fetch the 5 most recent unread notifications
    notifications = Notification.objects.filter(is_read=False).order_by('-created_at')[:5]
    data = [
        {"id": n.id, "message": n.message, "created_at": n.created_at.strftime("%H:%M")} 
        for n in notifications
    ]
    return JsonResponse({'notifications': data})

from .models import PenaltyCase
from .serializers import PenaltyCaseSerializer
# ... [Your other imports] ...

class PenaltyCaseViewSet(viewsets.ModelViewSet):
    queryset = PenaltyCase.objects.all().order_by('-loggedDate')
    serializer_class = PenaltyCaseSerializer