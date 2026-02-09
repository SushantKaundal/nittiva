"""
User serializers.

This module contains serializers for user registration and user data.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirmation = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "role",
            "password",
            "password_confirmation",
            "first_name",
            "last_name",
        ]
        extra_kwargs = {"role": {"required": False}, "name": {"required": False}}

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs.get("password") != attrs.get("password_confirmation"):
            raise serializers.ValidationError({"password_confirmation": "Passwords do not match"})
        return attrs

    def create(self, validated_data):
        """Create a new user."""
        validated_data.pop("password_confirmation", None)
        first = validated_data.pop("first_name", "").strip()
        last = validated_data.pop("last_name", "").strip()
        if not validated_data.get("name"):
            validated_data["name"] = f"{first} {last}".strip()

        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "role",
            "is_active",
            "is_staff",
            "created_at",
            "updated_at",
            "profile_image_url",
            "auth_provider",
        ]


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication."""

    token = serializers.CharField(required=True, write_only=True)

