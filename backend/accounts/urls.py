from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, CurrentUserView, 
    CSRFTokenView, ProfileUpdateView, ForgotPasswordView,
    SendOTPView, VerifyOTPView, ResetPasswordOTPView,
    ContactListCreateView, ContactDetailView, ContactDirectCallView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('profile/', ProfileUpdateView.as_view(), name='auth-profile'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('send-otp/', SendOTPView.as_view(), name='auth-send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('reset-password-otp/', ResetPasswordOTPView.as_view(), name='auth-reset-password-otp'),
    path('csrf/', CSRFTokenView.as_view(), name='auth-csrf'),
    path('contacts/', ContactListCreateView.as_view(), name='contacts-list-create'),
    path('contacts/<int:pk>/', ContactDetailView.as_view(), name='contacts-detail'),
    path('contacts/<int:pk>/call/', ContactDirectCallView.as_view(), name='contacts-direct-call'),
]



