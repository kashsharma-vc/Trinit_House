from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, PenaltyViewSet

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet)
router.register(r'penalties', PenaltyViewSet)

urlpatterns = [
    path('', include(router.urls)),
]