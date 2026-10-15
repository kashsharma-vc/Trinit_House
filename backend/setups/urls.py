
# setups/urls.py
from setups import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, RegisterView, RoleAccessMappingViewSet, RoleViewSet,
    ZoneViewSet, WorkshopViewSet, CategoryViewSet, CompressorViewSet,
    FeatureMasterViewSet, AppFeatureViewSet, ForgotPasswordView,
    VerifyOTPAndResetPasswordView, UserApprovalViewSet,
    SOPStageTemplateViewSet, ChecklistTemplateViewSet, UserViewSet
)

# The DefaultRouter automatically wires up all the URLs for our ViewSets
router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'zones', ZoneViewSet)
router.register(r'workshops', WorkshopViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'compressors', CompressorViewSet)
router.register(r'role-access-mappings', RoleAccessMappingViewSet, basename='role-access-mappings')
router.register(r'features-master', FeatureMasterViewSet, basename='features-master')
router.register(r'app-features', AppFeatureViewSet, basename='app-features')
router.register(r'user-approvals', UserApprovalViewSet, basename='user-approvals')
router.register(r'sop-templates', SOPStageTemplateViewSet, basename='sop-templates')
router.register(r'checklist-templates', ChecklistTemplateViewSet, basename='checklist-templates')
router.register(r'users', UserViewSet, basename='users')

from .sso_views import VibeConnectSSOCallbackView

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('auth/reset-password/', VerifyOTPAndResetPasswordView.as_view(), name='auth_reset_password'),
    path('auth/sso/callback/', VibeConnectSSOCallbackView.as_view(), name='auth_sso_callback'),
    path('profile/update/', views.ProfileUpdateView.as_view(), name='profile_update'),
    path('technicians/', views.TechnicianListView.as_view(), name='technician-list'),
]