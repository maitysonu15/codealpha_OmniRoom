from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from meetings.models import Meeting
from .models import WhiteboardSession

class WhiteboardSessionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, meeting_code):
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        session, created = WhiteboardSession.objects.get_or_create(meeting=meeting)
        return Response({
            'meeting_code': meeting.meeting_code,
            'snapshot_data': session.snapshot_data,
            'updated_at': session.updated_at
        }, status=status.HTTP_200_OK)

    def post(self, request, meeting_code):
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        session, created = WhiteboardSession.objects.get_or_create(meeting=meeting)
        snapshot_data = request.data.get('snapshot_data', '')
        session.snapshot_data = snapshot_data
        session.save()
        return Response({
            'message': 'Whiteboard saved successfully.',
            'meeting_code': meeting.meeting_code,
            'updated_at': session.updated_at
        }, status=status.HTTP_200_OK)
