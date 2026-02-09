"""
Authentication views.

This module contains views for authentication, registration, and health checks.
"""

from django.db import connection
from django.http import JsonResponse
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from django.contrib.auth import get_user_model
from ..serializers import RegisterSerializer, UserSerializer, GoogleAuthSerializer
from ..utils.responses import success_response, error_response

User = get_user_model()

# Import GoogleAuthService only when needed (lazy import)
try:
    from ..services.google_auth import GoogleAuthService
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False
    GoogleAuthService = None


class LoginSerializer(TokenObtainPairSerializer):
    """Custom login serializer that adds user info to token."""

    def validate(self, attrs):
        """Validate credentials and return token data."""
        data = super().validate(attrs)
        return data

    @classmethod
    def get_token(cls, user):
        """Add custom claims to token."""
        token = super().get_token(user)
        token["email"] = user.email
        token["name"] = getattr(user, "name", "")
        token["role"] = getattr(user, "role", "user")
        return token


class LoginView(TokenObtainPairView):
    """Login view that returns JWT tokens."""

    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        """Handle login request."""
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            return success_response(
                data=serializer.validated_data,
                message="Login successful",
                status_code=status.HTTP_200_OK,
            )
        except Exception as e:
            return error_response(
                message="Invalid credentials. Please check email/password.",
                errors=str(e),
                status_code=status.HTTP_401_UNAUTHORIZED,
            )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    """Register a new user."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return success_response(
            data={
                "user": UserSerializer(user).data,
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            },
            message="User registered successfully",
            status_code=status.HTTP_201_CREATED,
        )
    return error_response(
        message="Registration failed",
        errors=serializer.errors,
        status_code=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def healthz(request):
    """Lightweight liveness probe."""
    return JsonResponse({"status": "ok"}, status=200)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def readyz(request):
    """Readiness probe that also checks DB connectivity."""
    try:
        connection.ensure_connection()
        return JsonResponse({"status": "ok", "db": "ok"}, status=200)
    except Exception as exc:
        return JsonResponse({"status": "error", "db": str(exc)}, status=500)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    """Authenticate user with Google OAuth token."""
    if not GOOGLE_AUTH_AVAILABLE:
        return error_response(
            message="Google authentication is not available. Please install google-auth package.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    
    serializer = GoogleAuthSerializer(data=request.data)
    
    if not serializer.is_valid():
        return error_response(
            message="Invalid request data",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    token = serializer.validated_data.get("token")
    
    try:
        # Verify Google token and get user info
        google_user_info = GoogleAuthService.verify_token(token)
        
        google_id = google_user_info.get("google_id")
        email = google_user_info.get("email")
        name = google_user_info.get("name", "")
        picture = google_user_info.get("picture", "")
        
        if not email:
            return error_response(
                message="Google account does not have an email address",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        # Check if user exists by Google ID or email
        user = None
        is_new_user = False
        
        # First, try to find by Google ID
        if google_id:
            try:
                user = User.objects.get(google_id=google_id)
            except User.DoesNotExist:
                pass
        
        # If not found by Google ID, try to find by email
        if not user:
            try:
                user = User.objects.get(email=email)
                # Link Google ID to existing user if not already linked
                if not user.google_id:
                    user.google_id = google_id
                    user.auth_provider = "google"
                    if picture and not user.profile_image_url:
                        user.profile_image_url = picture
                    user.save()
            except User.DoesNotExist:
                # Create new user
                is_new_user = True
                user = User.objects.create(
                    email=email,
                    name=name or email.split("@")[0],
                    google_id=google_id,
                    profile_image_url=picture,
                    auth_provider="google",
                )
                user.set_unusable_password()  # No password needed for OAuth users
                user.save()
        else:
            # Update user info if needed
            if picture and user.profile_image_url != picture:
                user.profile_image_url = picture
            if name and user.name != name:
                user.name = name
            user.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Add custom claims to token
        access_token["email"] = user.email
        access_token["name"] = user.name
        access_token["role"] = user.role
        
        return success_response(
            data={
                "user": UserSerializer(user).data,
                "access_token": str(access_token),
                "refresh_token": str(refresh),
                "isNewUser": is_new_user,
            },
            message="Google authentication successful",
            status_code=status.HTTP_200_OK,
        )
    
    except ValueError as e:
        return error_response(
            message=str(e),
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return error_response(
            message=f"Google authentication failed: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

