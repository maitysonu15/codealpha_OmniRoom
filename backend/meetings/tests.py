from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from meetings.models import Meeting, MeetingParticipant

class MeetingsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='hostuser', password='password123')
        self.client.force_authenticate(user=self.user)

    def test_create_meeting(self):
        response = self.client.post('/api/meetings/create/', {'title': 'Sprint Review'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('meeting_code', response.data)
        meeting = Meeting.objects.get(meeting_code=response.data['meeting_code'])
        self.assertEqual(meeting.host, self.user)
        self.assertTrue(MeetingParticipant.objects.filter(meeting=meeting, user=self.user, role='host').exists())

    def test_join_meeting(self):
        meeting = Meeting.objects.create(host=self.user, title='Team Sync')
        other_user = User.objects.create_user(username='participantuser', password='password123')
        
        self.client.force_authenticate(user=other_user)
        join_resp = self.client.post('/api/meetings/join/', {'meeting_code': meeting.meeting_code})
        self.assertEqual(join_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(MeetingParticipant.objects.filter(meeting=meeting, user=other_user).exists())
