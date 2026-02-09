"""
User views.

This module contains viewsets for user management.
"""

from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets

from ..permissions import IsAdminOrReadOnly
from ..serializers import UserSerializer

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management."""

    queryset = User.objects.all().order_by("-created_at")
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["role", "is_active", "is_staff"]
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

