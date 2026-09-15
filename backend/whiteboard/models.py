from django.db import models
from django.contrib.auth.models import User
from meetings.models import Meeting

class WhiteboardSession(models.Model):
    meeting = models.OneToOneField(Meeting, on_delete=models.CASCADE, related_name='whiteboard')
    snapshot_data = models.TextField(blank=True, default='')  # Canvas JSON snapshot
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Whiteboard for {self.meeting.meeting_code}"
