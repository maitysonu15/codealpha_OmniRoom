from django.contrib.auth.models import User
from django.contrib.auth.models import AnonymousUser
from .models import UserProfile

def get_or_create_default_user():
    """Returns a persistent default guest user for OmniRoom when authentication is bypassed."""
    user, created = User.objects.get_or_create(
        username='omniroom_user',
        defaults={
            'email': 'user@omniroom.local',
            'first_name': 'OmniRoom',
            'last_name': 'User',
            'is_active': True
        }
    )
    if created or not hasattr(user, 'profile'):
        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'avatar_url': '',
                'is_email_verified': True
            }
        )
    return user

class AutoUserMiddleware:
    """
    Middleware that ensures every incoming request has an active User attached
    to request.user even when no authentication headers or session cookies exist.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not hasattr(request, 'user') or request.user.is_anonymous:
            request.user = get_or_create_default_user()
        return self.get_response(request)
