"""
Client serializers.

This module contains serializers for client data.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

from ..models import Client
from .user import UserSerializer

User = get_user_model()


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for client data."""

    owner = UserSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        source="owner", queryset=User.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = Client
        fields = "__all__"

