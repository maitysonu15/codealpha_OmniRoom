from django.urls import path
from .views import WhiteboardSessionView

urlpatterns = [
    path('<str:meeting_code>/', WhiteboardSessionView.as_view(), name='whiteboard-session'),
]
