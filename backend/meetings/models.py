import secrets
import string
from django.db import models
from django.contrib.auth.models import User

def generate_meeting_code():
    """Generates a clean 9-character code formatted as xxx-yyyy-zzz"""
    chars = string.ascii_lowercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(3))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    part3 = ''.join(secrets.choice(chars) for _ in range(3))
    return f"{part1}-{part2}-{part3}"

class Meeting(models.Model):
    meeting_code = models.CharField(max_length=20, unique=True, default=generate_meeting_code)
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hosted_meetings')
    title = models.CharField(max_length=255, default='Instant Meeting')
    description = models.TextField(blank=True, default='')
    waiting_room = models.BooleanField(default=False)
    mute_on_entry = models.BooleanField(default=False)
    require_auth = models.BooleanField(default=True)
    allow_before_host = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.meeting_code})"

class MeetingParticipant(models.Model):
    ROLE_CHOICES = [
        ('host', 'Host'),
        ('cohost', 'Co-Host'),
        ('participant', 'Participant'),
    ]

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meeting_participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='participant')
    is_muted = models.BooleanField(default=False)
    is_camera_off = models.BooleanField(default=False)
    hand_raised = models.BooleanField(default=False)

    class Meta:
        unique_together = ('meeting', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.meeting.meeting_code} as {self.role}"

class ScheduledMeeting(models.Model):
    host = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_meetings')
    meeting = models.ForeignKey(Meeting, on_delete=models.SET_NULL, null=True, blank=True, related_name='scheduled_instance')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    meeting_code = models.CharField(max_length=20, default=generate_meeting_code)
    waiting_room = models.BooleanField(default=False)
    require_auth = models.BooleanField(default=True)
    is_recurring = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} at {self.start_time}"
