from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import EmailVerificationOTP

class AccountsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.username = 'testuser'
        self.password = 'password123'
        self.email = 'test@onemeet.com'

    def test_unauthenticated_access_allowed(self):
        # /api/auth/me/ returns 200 OK without requiring authentication
        me_resp = self.client.get('/api/auth/me/')
        self.assertEqual(me_resp.status_code, status.HTTP_200_OK)
        self.assertIn('user', me_resp.data)

    def test_user_registration(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'new@onemeet.com',
            'password': 'password123',
            'confirm_password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_login_wrong_password(self):
        User.objects.create_user(username=self.username, email=self.email, password=self.password)
        resp = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': 'WrongPassword123'
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_step1_requires_otp(self):
        User.objects.create_user(username=self.username, email=self.email, password=self.password)
        login_resp = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(login_resp.data.get('requires_otp'))
        self.assertEqual(login_resp.data.get('purpose'), 'login')
        self.assertEqual(login_resp.data.get('email'), self.email)

    def test_login_step2_wrong_otp(self):
        user = User.objects.create_user(username=self.username, email=self.email, password=self.password)
        self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })
        verify_resp = self.client.post('/api/auth/verify-otp/', {
            'email': self.email,
            'otp_code': '000000',
            'purpose': 'login'
        })
        self.assertEqual(verify_resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_step2_correct_otp_creates_session_and_preserves_email_verification_status(self):
        user = User.objects.create_user(username=self.username, email=self.email, password=self.password)
        user.profile.is_email_verified = False
        user.profile.save()

        self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': self.password
        })

        otp_record = EmailVerificationOTP.objects.filter(
            email=self.email,
            purpose='login',
            is_verified=False
        ).first()
        self.assertIsNotNone(otp_record)

        verify_resp = self.client.post('/api/auth/verify-otp/', {
            'email': self.email,
            'otp_code': otp_record.otp_code,
            'purpose': 'login'
        })
        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_resp.data.get('authenticated'))
        self.assertTrue(verify_resp.data.get('verified'))

        # Session is active and returns logged in user
        me_resp = self.client.get('/api/auth/me/')
        self.assertEqual(me_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(me_resp.data['user']['username'], self.username)

        # Login OTP must NOT set is_email_verified = True
        user.refresh_from_db()
        self.assertFalse(user.profile.is_email_verified)

    def test_password_reset_otp_flow(self):
        user = User.objects.create_user(username=self.username, email=self.email, password=self.password)
        fp_resp = self.client.post('/api/auth/forgot-password/', {'email': self.email})
        self.assertEqual(fp_resp.status_code, status.HTTP_200_OK)

        otp_record = EmailVerificationOTP.objects.filter(
            email=self.email,
            purpose='reset_password',
            is_verified=False
        ).first()
        self.assertIsNotNone(otp_record)

        reset_resp = self.client.post('/api/auth/reset-password-otp/', {
            'email': self.email,
            'otp_code': otp_record.otp_code,
            'new_password': 'BrandNewPassword123!',
            'confirm_password': 'BrandNewPassword123!'
        })
        self.assertEqual(reset_resp.status_code, status.HTTP_200_OK)

        # Verify login works with new password
        login_resp = self.client.post('/api/auth/login/', {
            'username': self.username,
            'password': 'BrandNewPassword123!'
        })
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertTrue(login_resp.data.get('requires_otp'))
