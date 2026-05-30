from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarrantyCallViewSet

router = DefaultRouter()
# This creates the /calls/ endpoint automatically
router.register(r'calls', WarrantyCallViewSet, basename='warranty-calls')

urlpatterns = [
    path('', include(router.urls)),
]