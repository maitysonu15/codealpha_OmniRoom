import random
import string
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar_url = models.URLField(blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.username} (Verified: {self.is_email_verified})"

class EmailVerificationOTP(models.Model):
    PURPOSE_CHOICES = (
        ('register', 'Account Registration'),
        ('login', '2-Step Login Verification'),
        ('reset_password', 'Password Reset'),
        ('verify_email', 'Email Address Verification'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='otps')
    email = models.EmailField(db_index=True)
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='register')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email Verification OTP'
        verbose_name_plural = 'Email Verification OTPs'

    def __str__(self):
        return f"OTP {self.otp_code} for {self.email} ({self.purpose})"

    @classmethod
    def generate_otp_for_email(cls, email, purpose='register', user=None):
        # Invalidate past unused OTPs for this email and purpose
        cls.objects.filter(email__iexact=email, purpose=purpose, is_verified=False).delete()

        # Generate cryptographically strong numeric 6-digit OTP
        digits = string.digits
        otp = ''.join(random.SystemRandom().choice(digits) for _ in range(6))
        
        expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)

        return cls.objects.create(
            user=user,
            email=email.strip().lower(),
            otp_code=otp,
            purpose=purpose,
            expires_at=expires_at
        )

    def is_valid(self):
        return (not self.is_verified) and (timezone.now() <= self.expires_at)

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()

class Contact(models.Model):
    STATUS_CHOICES = (
        ('online', 'Online'),
        ('in_meeting', 'In Meeting'),
        ('offline', 'Offline'),
    )

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacts')
    contact_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='contact_of')
    name = models.CharField(max_length=150)
    email = models.EmailField()
    role = models.CharField(max_length=100, blank=True, default='Teammate')
    avatar_url = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='online')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ('owner', 'email')

    def __str__(self):
        return f"{self.name} ({self.email}) for {self.owner.username}"


