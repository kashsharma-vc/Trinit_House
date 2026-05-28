from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from .models import Invoice, Penalty
from .serializers import InvoiceSerializer, PenaltySerializer
from operations.models import ServiceRequest
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication, SessionAuthentication

class InvoiceViewSet(viewsets.ModelViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    queryset = Invoice.objects.all().order_by('-date_created')
    serializer_class = InvoiceSerializer

    def perform_create(self, serializer):
        job_code = serializer.validated_data.get('job_code')
        if job_code and job_code.status != 'Closed':
            raise ValidationError("Invoices can only be generated for fully completed (Closed) service requests.")
        
        # Admin is notified automatically since the invoice is created
        serializer.save(issued_by=self.request.user.username)

class PenaltyViewSet(viewsets.ModelViewSet):
    queryset = Penalty.objects.all()
    serializer_class = PenaltySerializer