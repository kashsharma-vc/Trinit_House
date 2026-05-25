from rest_framework import viewsets
from .models import WarrantyCall
from .serializers import WarrantyCallSerializer
from django.http import HttpResponse
import csv

class WarrantyCallViewSet(viewsets.ModelViewSet):
    # Fetch all records, newest first
    queryset = WarrantyCall.objects.all().order_by('-loggedDate')
    serializer_class = WarrantyCallSerializer

# views.p

def export_warranty_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="warranty_report.csv"'
    writer = csv.writer(response)
    writer.writerow(['ID', 'Equipment', 'Vendor', 'Status', 'Issue'])
    for call in WarrantyCall.objects.all():
        writer.writerow([call.call_id, call.equipment, call.vendor, call.status, call.issue])
    return response

