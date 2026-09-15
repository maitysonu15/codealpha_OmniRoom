from django.urls import path
from .views import (
    CreateMeetingView, MeetingListView, MeetingDetailView, JoinMeetingView,
    LeaveMeetingView, EndMeetingView, MeetingParticipantsListView, 
    MeetingMessagesView, ScheduledMeetingView
)

urlpatterns = [
    path('', MeetingListView.as_view(), name='meeting-list'),
    path('create/', CreateMeetingView.as_view(), name='meeting-create'),
    path('join/', JoinMeetingView.as_view(), name='meeting-join'),
    path('scheduled/', ScheduledMeetingView.as_view(), name='scheduled-meetings'),
    path('<str:meeting_code>/', MeetingDetailView.as_view(), name='meeting-detail'),
    path('<str:meeting_code>/leave/', LeaveMeetingView.as_view(), name='meeting-leave'),
    path('<str:meeting_code>/end/', EndMeetingView.as_view(), name='meeting-end'),
    path('<str:meeting_code>/participants/', MeetingParticipantsListView.as_view(), name='meeting-participants'),
    path('<str:meeting_code>/messages/', MeetingMessagesView.as_view(), name='meeting-messages'),
]
