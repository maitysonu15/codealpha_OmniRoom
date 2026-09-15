from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Meeting, MeetingParticipant, ScheduledMeeting
from .serializers import (
    MeetingSerializer, CreateMeetingSerializer, JoinMeetingSerializer, 
    ScheduledMeetingSerializer, MeetingParticipantSerializer, MeetingChatMessageSerializer
)
from chat.models import ChatMessage
from accounts.middleware import get_or_create_default_user

def get_request_user(request):
    """Helper to ensure a valid User model instance is always retrieved."""
    if hasattr(request, 'user') and request.user and not request.user.is_anonymous:
        return request.user
    return get_or_create_default_user()

class CreateMeetingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = get_request_user(request)
        serializer = CreateMeetingSerializer(data=request.data)
        if serializer.is_valid():
            title = serializer.validated_data.get('title') or f"{user.username}'s Meeting"
            description = serializer.validated_data.get('description', '')
            waiting_room = serializer.validated_data.get('waiting_room', False)
            mute_on_entry = serializer.validated_data.get('mute_on_entry', False)
            require_auth = serializer.validated_data.get('require_auth', False)
            allow_before_host = serializer.validated_data.get('allow_before_host', True)

            meeting = Meeting.objects.create(
                host=user,
                title=title,
                description=description,
                waiting_room=waiting_room,
                mute_on_entry=mute_on_entry,
                require_auth=False,
                allow_before_host=allow_before_host
            )
            # Register host as participant
            MeetingParticipant.objects.create(
                meeting=meeting,
                user=user,
                role='host'
            )
            return Response(MeetingSerializer(meeting).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeetingListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = get_request_user(request)
        # Return recent meetings
        user_meetings = Meeting.objects.filter(
            participants__user=user
        ).distinct().order_by('-created_at')[:30]
        
        # If none found for this user, return latest active meetings
        if not user_meetings.exists():
            user_meetings = Meeting.objects.all().order_by('-created_at')[:30]

        return Response(MeetingSerializer(user_meetings, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        return CreateMeetingView().post(request)

class MeetingDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, meeting_code):
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        return Response(MeetingSerializer(meeting).data, status=status.HTTP_200_OK)

class JoinMeetingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = get_request_user(request)
        serializer = JoinMeetingSerializer(data=request.data)
        if serializer.is_valid():
            meeting_code = serializer.validated_data['meeting_code'].strip()
            meeting = Meeting.objects.filter(meeting_code=meeting_code, is_active=True).first()
            if not meeting:
                return Response(
                    {'error': 'Meeting not found or has ended. Please check the code.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Register or update participant
            role = 'host' if meeting.host == user else 'participant'
            participant, created = MeetingParticipant.objects.get_or_create(
                meeting=meeting,
                user=user,
                defaults={'role': role}
            )
            if not created and participant.left_at is not None:
                participant.left_at = None
                participant.save()

            return Response({
                'message': 'Joined meeting successfully.',
                'meeting': MeetingSerializer(meeting).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LeaveMeetingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, meeting_code):
        user = get_request_user(request)
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        participant = MeetingParticipant.objects.filter(meeting=meeting, user=user).first()
        if participant:
            participant.left_at = timezone.now()
            participant.save()
        return Response({'message': 'Left meeting successfully.'}, status=status.HTTP_200_OK)

class EndMeetingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, meeting_code):
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        meeting.is_active = False
        meeting.ended_at = timezone.now()
        meeting.save()
        
        # Mark all active participants as left
        MeetingParticipant.objects.filter(meeting=meeting, left_at__isnull=True).update(left_at=timezone.now())
        return Response({'message': 'Meeting ended successfully.'}, status=status.HTTP_200_OK)

class MeetingParticipantsListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, meeting_code):
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        participants = MeetingParticipant.objects.filter(meeting=meeting, left_at__isnull=True)
        return Response(MeetingParticipantSerializer(participants, many=True).data, status=status.HTTP_200_OK)

class MeetingMessagesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, meeting_code):
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        messages = ChatMessage.objects.filter(meeting=meeting).order_by('created_at')[:100]
        return Response(MeetingChatMessageSerializer(messages, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, meeting_code):
        user = get_request_user(request)
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        text = request.data.get('message', '').strip()
        if not text:
            return Response({'error': 'Message text is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        msg = ChatMessage.objects.create(
            meeting=meeting,
            sender=user,
            message=text
        )
        return Response(MeetingChatMessageSerializer(msg).data, status=status.HTTP_201_CREATED)

class ScheduledMeetingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = get_request_user(request)
        scheduled = ScheduledMeeting.objects.filter(host=user).order_by('start_time')
        if not scheduled.exists():
            scheduled = ScheduledMeeting.objects.all().order_by('start_time')
        return Response(ScheduledMeetingSerializer(scheduled, many=True).data, status=status.HTTP_200_OK)

    def post(self, request):
        user = get_request_user(request)
        serializer = ScheduledMeetingSerializer(data=request.data)
        if serializer.is_valid():
            title = serializer.validated_data.get('title', 'Scheduled Meeting')
            description = serializer.validated_data.get('description', '')
            start_time = serializer.validated_data.get('start_time')
            end_time = serializer.validated_data.get('end_time')
            waiting_room = serializer.validated_data.get('waiting_room', False)
            require_auth = serializer.validated_data.get('require_auth', False)
            is_recurring = serializer.validated_data.get('is_recurring', False)

            # Pre-create the actual Meeting instance
            meeting = Meeting.objects.create(
                host=user,
                title=title,
                description=description,
                waiting_room=waiting_room,
                require_auth=False,
                is_active=True
            )
            # Register host
            MeetingParticipant.objects.create(
                meeting=meeting,
                user=user,
                role='host'
            )

            scheduled_instance = ScheduledMeeting.objects.create(
                host=user,
                meeting=meeting,
                title=title,
                description=description,
                start_time=start_time,
                end_time=end_time,
                meeting_code=meeting.meeting_code,
                waiting_room=waiting_room,
                require_auth=False,
                is_recurring=is_recurring
            )
            return Response(ScheduledMeetingSerializer(scheduled_instance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
