from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from meetings.models import Meeting, MeetingParticipant
from .models import SharedFile
from .serializers import SharedFileSerializer
from accounts.middleware import get_or_create_default_user

def get_request_user(request):
    if hasattr(request, 'user') and request.user and not request.user.is_anonymous:
        return request.user
    return get_or_create_default_user()

class MeetingFilesView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, meeting_code):
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        files = SharedFile.objects.filter(meeting=meeting)
        return Response(SharedFileSerializer(files, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, meeting_code):
        meeting = get_object_or_404(Meeting, meeting_code=meeting_code)
        user = get_request_user(request)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        # Basic size limit check (e.g. 50MB max)
        if file_obj.size > 50 * 1024 * 1024:
            return Response({'error': 'File size exceeds 50MB limit.'}, status=status.HTTP_400_BAD_REQUEST)

        shared_file = SharedFile.objects.create(
            meeting=meeting,
            uploaded_by=user,
            file=file_obj,
            original_name=file_obj.name,
            file_size=file_obj.size
        )

        return Response(SharedFileSerializer(shared_file).data, status=status.HTTP_201_CREATED)
