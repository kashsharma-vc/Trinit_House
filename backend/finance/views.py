from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Invoice, Penalty
from .serializers import InvoiceSerializer, PenaltySerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-date_created')
    serializer_class = InvoiceSerializer

class PenaltyViewSet(viewsets.ModelViewSet):
    queryset = Penalty.objects.all()
    serializer_class = PenaltySerializer