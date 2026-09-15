from rest_framework import serializers
from .models import SharedFile
from accounts.serializers import UserSerializer

class SharedFileSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = SharedFile
        fields = ['id', 'meeting', 'uploaded_by', 'file', 'original_name', 'file_size', 'uploaded_at']
