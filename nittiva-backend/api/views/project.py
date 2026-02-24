"""
Project views.

This module contains viewsets for project management.
"""

from django.db.models import Q, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError

from ..models import Project
from ..serializers import ProjectSerializer
from ..utils.tenant import get_current_tenant_id


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for project management.
    
    - Staff sees all
    - Regular users see projects they own, are members of, OR have tasks in
      (so assignees will see the project in the sidebar)
    """

    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "client"]

    def get_queryset(self):
        """Get queryset filtered by tenant and user permissions."""
        u = self.request.user
        tenant_id = get_current_tenant_id(self.request)
        
        if not tenant_id:
            raise ValidationError("Tenant not found. Please ensure you're accessing via correct subdomain or X-Tenant-Subdomain header.")

        # Start with tenant-scoped queryset
        qs = Project.objects.filter(tenant_id=tenant_id)

        # optional scope handling: ?scope=all for staff
        scope = self.request.query_params.get("scope", "mine")

        if getattr(u, "is_staff", False) or getattr(u, "is_superuser", False):
            if scope != "all":
                qs = qs.filter(Q(owner=u) | Q(members=u) | Q(tasks__assignees=u))
        else:
            qs = qs.filter(
                Q(owner=u) | Q(members=u) | Q(tasks__assignees=u)
            )

        # annotate per-user task count (useful for the sidebar badges)
        return (
            qs.distinct()
            .annotate(task_count=Count("tasks", filter=Q(tasks__assignees=u)))
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        """Create project with tenant and owner set from request context."""
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        # tenant_id is already set in serializer.create() method, so just save
        serializer.save()

