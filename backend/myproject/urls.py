"""
URL configuration for myproject project.
"""

from django.contrib import admin
import os
from django.urls import path, include
from operations.views import mark_as_read_view, notification_list_view, unread_count_view
from django.conf.urls.static import static
from django.conf import settings
from setups.views import UserViewSet

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/setups/", include('setups.urls')),
    path('api/operations/', include('operations.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/warranty/', include('warranty.urls')),
    path('api/notifications/unread/', unread_count_view, name='unread-notifications'),
    path('api/notifications/read/<int:notification_id>/', mark_as_read_view),
    path('api/notifications/list/', notification_list_view),
    # Compatibility alias — frontend fetches /api/users/ directly
    path('api/users/', UserViewSet.as_view({'get': 'list'}), name='user-list-compat'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)