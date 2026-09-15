import json
import logging
import os
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.conf import settings
from django.utils import timezone

from .models import EmailVerificationOTP, UserProfile, Contact
from .middleware import get_or_create_default_user
from .serializers import UserSerializer, ContactSerializer
from meetings.models import Meeting

logger = logging.getLogger(__name__)

class SendOTPView(APIView):
    """Permissive OTP Dispatcher — instant mock success without blocking."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', 'guest@omniroom.local').strip().lower()
        purpose = request.data.get('purpose', 'login')
        return Response({
            'message': f'Verification OTP bypassed for {email}. OmniRoom is operating in open access mode.',
            'email': email,
            'purpose': purpose,
            'dev_otp': '123456'
        }, status=status.HTTP_200_OK)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class VerifyOTPView(APIView):
    """Permissive OTP Verifier — always verifies successfully."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        purpose = request.data.get('purpose', 'login')

        user = User.objects.filter(email__iexact=email).first() if email else None
        if not user:
            user = get_or_create_default_user()

        login(request, user)
        return Response({
            'message': 'Verification successful. Welcome to OmniRoom!',
            'verified': True,
            'authenticated': True,
            'purpose': purpose,
            'email': email or user.email,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class RegisterView(APIView):
    """
    Open Registration View.
    Accepts any submitted registration details without password complexity or OTP requirements.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip().lower()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        password = request.data.get('password', 'omniroom_open_pass')

        if not username and email:
            username = email.split('@')[0]
        elif not username:
            username = f"user_{int(timezone.now().timestamp())}"

        # Sanitize username for Django
        clean_username = ''.join(c for c in username if c.isalnum() or c in ('_', '-')) or f"user_{int(timezone.now().timestamp())}"

        # Retrieve existing or create new user
        user = User.objects.filter(username=clean_username).first()
        if not user and email:
            user = User.objects.filter(email__iexact=email).first()

        if not user:
            user = User.objects.create_user(
                username=clean_username,
                email=email or f"{clean_username}@omniroom.local",
                password=password,
                first_name=first_name or clean_username,
                last_name=last_name or ''
            )
        else:
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name
            if email:
                user.email = email
            user.save()

        if not hasattr(user, 'profile'):
            UserProfile.objects.get_or_create(
                user=user,
                defaults={'avatar_url': '', 'is_email_verified': True}
            )

        login(request, user)
        return Response({
            'message': 'Registration successful. Welcome to OmniRoom!',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class LoginView(APIView):
    """
    Open Login View.
    Accepts any login attempt immediately without credential blocking or OTP enforcement.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip().lower()

        lookup = username or email
        user = None

        if lookup:
            if '@' in lookup:
                user = User.objects.filter(email__iexact=lookup).first()
            if not user:
                user = User.objects.filter(username__iexact=lookup).first()

        if not user:
            # Dynamically create or fallback to active user
            if lookup:
                clean_name = ''.join(c for c in lookup.split('@')[0] if c.isalnum() or c in ('_', '-')) or 'user'
                user, _ = User.objects.get_or_create(
                    username=clean_name,
                    defaults={
                        'email': lookup if '@' in lookup else f"{clean_name}@omniroom.local",
                        'first_name': clean_name.capitalize(),
                        'last_name': '',
                        'is_active': True
                    }
                )
                if not hasattr(user, 'profile'):
                    UserProfile.objects.get_or_create(user=user, defaults={'is_email_verified': True})
            else:
                user = get_or_create_default_user()

        login(request, user)
        return Response({
            'message': 'Login successful. Welcome to OmniRoom!',
            'requires_otp': False,
            'verified': True,
            'authenticated': True,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)

class CurrentUserView(APIView):
    """Always returns an active user object without requiring authentication headers."""
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if (hasattr(request, 'user') and request.user and not request.user.is_anonymous) else get_or_create_default_user()
        serializer = UserSerializer(user)
        return Response({'user': serializer.data}, status=status.HTTP_200_OK)

class CSRFTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        csrf_token = get_token(request)
        return Response({'csrfToken': csrf_token}, status=status.HTTP_200_OK)

class ProfileUpdateView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request):
        user = request.user if (hasattr(request, 'user') and request.user and not request.user.is_anonymous) else get_or_create_default_user()
        email = request.data.get('email')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        avatar_url = request.data.get('avatar_url')

        if email is not None:
            user.email = email.strip().lower()
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        user.save()

        if avatar_url is not None and hasattr(user, 'profile'):
            user.profile.avatar_url = avatar_url
            user.profile.save()

        return Response({
            'message': 'Profile updated successfully.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class ResetPasswordOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response({
            'message': 'Password reset successful. OmniRoom is running in open access mode.'
        }, status=status.HTTP_200_OK)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        return Response({
            'message': f'Password reset request accepted for {email or "your account"}.'
        }, status=status.HTTP_200_OK)

class ContactListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if (hasattr(request, 'user') and request.user and not request.user.is_anonymous) else get_or_create_default_user()
        contacts = Contact.objects.filter(owner=user).order_by('name')
        serializer = ContactSerializer(contacts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user if (hasattr(request, 'user') and request.user and not request.user.is_anonymous) else get_or_create_default_user()
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        role = request.data.get('role', 'Teammate').strip() or 'Teammate'
        avatar_url = request.data.get('avatar_url', '').strip()

        if not name:
            return Response({'error': 'Contact name is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({'error': 'Contact email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if Contact.objects.filter(owner=user, email=email).exists():
            return Response({'error': f'Contact with email "{email}" already exists in your contact list.'}, status=status.HTTP_400_BAD_REQUEST)

        matched_user = User.objects.filter(email__iexact=email).first()

        contact = Contact.objects.create(
            owner=user,
            contact_user=matched_user,
            name=name,
            email=email,
            role=role,
            avatar_url=avatar_url or (getattr(getattr(matched_user, 'profile', None), 'avatar_url', None) if matched_user else ''),
            status='online'
        )

        serializer = ContactSerializer(contact)
        return Response({
            'message': f'Contact {name} added successfully.',
            'contact': serializer.data
        }, status=status.HTTP_201_CREATED)

class ContactDetailView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, pk):
        user = request.user if (hasattr(request, 'user') and request.user and not request.user.is_anonymous) else get_or_create_default_user()
        try:
            contact = Contact.objects.get(pk=pk, owner=user)
            contact_name = contact.name
            contact.delete()
            return Response({'message': f'Contact {contact_name} deleted successfully.'}, status=status.HTTP_200_OK)
        except Contact.DoesNotExist:
            return Response({'error': 'Contact not found.'}, status=status.HTTP_404_NOT_FOUND)

class ContactDirectCallView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        user = request.user if (hasattr(request, 'user') and request.user and not request.user.is_anonymous) else get_or_create_default_user()
        try:
            contact = Contact.objects.get(pk=pk, owner=user)
        except Contact.DoesNotExist:
            return Response({'error': 'Contact not found.'}, status=status.HTTP_404_NOT_FOUND)

        meeting = Meeting.objects.create(
            host=user,
            title=f"Direct Call with {contact.name}",
            description=f"Direct 1-on-1 collaboration call initiated by {user.username} with {contact.name}",
            waiting_room=False,
            require_auth=False,
            is_active=True
        )

        meeting_url = f"/meeting.html?code={meeting.meeting_code}"
        return Response({
            'message': f'Meeting initialized with {contact.name}.',
            'meeting_code': meeting.meeting_code,
            'meeting_url': meeting_url,
            'contact': ContactSerializer(contact).data
        }, status=status.HTTP_200_OK)



