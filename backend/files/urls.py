from django.urls import path
from .views import MeetingFilesView

urlpatterns = [
    path('meeting/<str:meeting_code>/', MeetingFilesView.as_view(), name='meeting-files'),
]
