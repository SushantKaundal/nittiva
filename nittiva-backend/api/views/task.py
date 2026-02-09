"""
Task views.

This module contains viewsets for task management.
"""

from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets

from ..models import Task
from ..serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for task management.
    
    - Staff sees all
    - Regular users see tasks in accessible projects OR assigned directly
    - Auto-add assignees as project members on create/update
    """

    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "priority", "project"]

    def get_queryset(self):
        """Get queryset filtered by user permissions."""
        u = self.request.user
        qs = Task.objects.select_related("project").prefetch_related("assignees")

        # accept either ?project=14 (DRF default) or ?projectId=14 (your UI)
        project_id = self.request.query_params.get("project") or \
                     self.request.query_params.get("projectId")
        if project_id:
            qs = qs.filter(project_id=project_id)

        # Admins/staff: see everything
        if getattr(u, "is_staff", False) or getattr(u, "is_superuser", False):
            return qs.order_by("-created_at")

        # Regular users: only tasks assigned to them (and/or they created)
        return (
            qs.filter(Q(assignees=u) | Q(created_by=u))
              .distinct()
              .order_by("-created_at")
        )

