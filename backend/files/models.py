from django.db import models
from django.contrib.auth.models import User
from meetings.models import Meeting

def meeting_file_path(instance, filename):
    return f"meetings/{instance.meeting.meeting_code}/{filename}"

class SharedFile(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='files')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    file = models.FileField(upload_to=meeting_file_path)
    original_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.original_name} ({self.meeting.meeting_code})"
