from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import EmailVerificationOTP, Contact

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.CharField(source='profile.avatar_url', read_only=True, default='')
    is_email_verified = serializers.BooleanField(source='profile.is_email_verified', read_only=True, default=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar_url', 'is_email_verified', 'date_joined']

class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(
        choices=['register', 'login', 'reset_password', 'verify_email'],
        default='register'
    )

    def validate_email(self, value):
        return value.strip().lower()

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)
    purpose = serializers.ChoiceField(
        choices=['register', 'login', 'reset_password', 'verify_email'],
        default='register'
    )

    def validate_email(self, value):
        return value.strip().lower()

    def validate_otp_code(self, value):
        return value.strip()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    otp_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    avatar_url = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'otp_code', 'avatar_url']

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        username = data.get('username', '').strip()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError({"username": "Username is already taken."})
        
        email = data.get('email', '').strip().lower()
        if not email:
            raise serializers.ValidationError({"email": "Email address is required."})
        
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "Email is already registered."})
        
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        otp_code = validated_data.pop('otp_code', None)
        avatar_url = validated_data.pop('avatar_url', None)

        user = User.objects.create_user(
            username=validated_data['username'].strip(),
            email=validated_data['email'].strip().lower(),
            password=validated_data['password']
        )

        if avatar_url and hasattr(user, 'profile'):
            user.profile.avatar_url = avatar_url
            user.profile.save()

        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    otp_code = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        username = data.get('username', '').strip()
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError("Must include both username/email and password.")

        # Allow login by either username or email
        user = authenticate(username=username, password=password)
        if not user and '@' in username:
            try:
                user_obj = User.objects.get(email__iexact=username)
                user = authenticate(username=user_obj.username, password=password)
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                user = None

        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        data['user'] = user
        return data

class ResetPasswordOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, data):
        if data.get('new_password') != data.get('confirm_password'):
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        return data

class ContactSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='contact_user.id', read_only=True)
    is_registered = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = ['id', 'name', 'email', 'role', 'avatar_url', 'status', 'user_id', 'is_registered', 'created_at']

    def get_is_registered(self, obj):
        return obj.contact_user is not None or User.objects.filter(email__iexact=obj.email).exists()

    def validate_email(self, value):
        return value.strip().lower()


