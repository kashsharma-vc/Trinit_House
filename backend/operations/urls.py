from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PenaltyCaseViewSet, ServiceRequestViewSet, ChecklistItemViewSet
from .ai_views import chat_with_assistant

router = DefaultRouter()
router.register(r'requests', ServiceRequestViewSet, basename='requests')
router.register(r'penalty/cases', PenaltyCaseViewSet, basename='penalty-cases')
router.register(r'checklist-items', ChecklistItemViewSet, basename='checklist-items')

urlpatterns = [
    path('', include(router.urls)),
    path('ai/chat/', chat_with_assistant, name='ai-chat'),
]