from rest_framework.authentication import BaseAuthentication
from .middleware import get_or_create_default_user

class OpenAuthentication(BaseAuthentication):
    """
    Permissive authentication backend that allows all requests:
    - If a Django session user is logged in, uses that user.
    - Otherwise, provides the default active user instance seamlessly.
    """
    def authenticate(self, request):
        django_user = getattr(request._request, 'user', None)
        if django_user and django_user.is_authenticated:
            return (django_user, None)
        return (get_or_create_default_user(), None)
