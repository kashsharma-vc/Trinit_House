from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets
from .models import Role, Zone, Workshop, Category , Compressor
from .serializers import RoleSerializer, ZoneSerializer, WorkshopSerializer, CategorySerializer ,CompressorSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer

class WorkshopViewSet(viewsets.ModelViewSet):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

from django.http import HttpResponse

class CompressorViewSet(viewsets.ModelViewSet):
    queryset = Compressor.objects.all()
    serializer_class = CompressorSerializer

