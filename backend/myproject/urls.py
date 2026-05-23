"""
URL configuration for myproject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path , include
from operations.views import mark_as_read_view, notification_list_view, unread_count_view 


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/setups/", include('setups.urls')),
    path('' , include('setups.urls')) , 
    path('api/inventory/', include('inventory.urls')),
    path('api/operations/', include('operations.urls')) ,
    path('api/finance/', include('finance.urls')),
    path('api/warranty/', include('warranty.urls')),
    path('api/notifications/unread/', unread_count_view, name='unread-notifications'),
    path('api/notifications/read/<int:notification_id>/', mark_as_read_view),
    path('api/notifications/list/', notification_list_view),
    path('api/warranty/', include('warranty.urls')),
] 

