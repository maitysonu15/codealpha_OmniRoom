from rest_framework import serializers
from .models import Meeting, MeetingParticipant, ScheduledMeeting
from accounts.serializers import UserSerializer
from chat.models import ChatMessage

class MeetingParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = MeetingParticipant
        fields = ['id', 'user', 'joined_at', 'left_at', 'role', 'is_muted', 'is_camera_off', 'hand_raised']

class MeetingSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)
    participants = MeetingParticipantSerializer(many=True, read_only=True)
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = Meeting
        fields = [
            'id', 'meeting_code', 'host', 'title', 'description', 
            'waiting_room', 'mute_on_entry', 'require_auth', 'allow_before_host',
            'created_at', 'started_at', 'ended_at', 'is_active', 
            'participants', 'participant_count'
        ]

    def get_participant_count(self, obj):
        return obj.participants.filter(left_at__isnull=True).count()

class CreateMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ['title', 'description', 'waiting_room', 'mute_on_entry', 'require_auth', 'allow_before_host']
        extra_kwargs = {
            'title': {'required': False},
            'description': {'required': False},
            'waiting_room': {'required': False},
            'mute_on_entry': {'required': False},
            'require_auth': {'required': False},
            'allow_before_host': {'required': False},
        }

class JoinMeetingSerializer(serializers.Serializer):
    meeting_code = serializers.CharField(max_length=20)

class ScheduledMeetingSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)

    class Meta:
        model = ScheduledMeeting
        fields = [
            'id', 'host', 'meeting', 'title', 'description', 
            'start_time', 'end_time', 'meeting_code', 'waiting_room', 
            'require_auth', 'is_recurring', 'created_at'
        ]
        read_only_fields = ['id', 'host', 'meeting', 'created_at']

class MeetingChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'meeting', 'sender', 'message', 'created_at']
