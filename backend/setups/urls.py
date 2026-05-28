
# setups/urls.py
from setups import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, RegisterView, RoleAccessMappingViewSet, RoleViewSet, ZoneViewSet, WorkshopViewSet, CategoryViewSet ,  CompressorViewSet


# The DefaultRouter automatically wires up all the URLs for our ViewSets
router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'zones', ZoneViewSet)
router.register(r'workshops', WorkshopViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'compressors', CompressorViewSet)
router.register(r'role-access-mappings', RoleAccessMappingViewSet, basename='role-access-mappings')
urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('technicians/', views.TechnicianListView.as_view(), name='technician-list'),

]