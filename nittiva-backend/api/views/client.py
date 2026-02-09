"""
Client views.

This module contains viewsets for client management.
"""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets

from ..models import Client
from ..serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """ViewSet for client management."""

    queryset = Client.objects.all().order_by("-created_at")
    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "company"]
    permission_classes = [permissions.IsAuthenticated]

