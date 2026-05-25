from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PenaltyCaseViewSet, ServiceRequestViewSet

router = DefaultRouter()
router.register(r'requests', ServiceRequestViewSet, basename='requests')
router.register(r'penalty/cases', PenaltyCaseViewSet, basename='penalty-cases')
urlpatterns = [
    path('', include(router.urls)),
]