
# setups/urls.py
from setups import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoleViewSet, ZoneViewSet, WorkshopViewSet, CategoryViewSet ,  CompressorViewSet

# The DefaultRouter automatically wires up all the URLs for our ViewSets
router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'zones', ZoneViewSet)
router.register(r'workshops', WorkshopViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'compressors', CompressorViewSet)

urlpatterns = [
    path('', include(router.urls)),

]