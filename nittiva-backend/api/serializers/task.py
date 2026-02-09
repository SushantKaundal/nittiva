"""
Task serializers.

This module contains serializers for task and task assignment data.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction

from ..models import Task, TaskAssignment, Project
from .user import UserSerializer

User = get_user_model()


class TaskAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for task assignment data."""

    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )

    class Meta:
        model = TaskAssignment
        fields = ["id", "user", "user_id", "assigned_at"]


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for task data."""

    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    assignees = UserSerializer(many=True, read_only=True)  # read: expanded users

    # write: list of user IDs
    assignee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    created_by = UserSerializer(read_only=True)
    updated_by = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "title",
            "description",
            "status",
            "priority",
            "progress",
            "due_date",
            "time_tracked_seconds",
            "custom_fields",
            "assignees",  # read
            "assignee_ids",  # write
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "assignees",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "time_tracked_seconds",
        ]

    def _set_audit_fields(self, instance, *, creating: bool):
        """Set audit fields (created_by, updated_by)."""
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if creating:
            instance.created_by = user
        instance.updated_by = user

    def _set_assignees(self, task: Task, assignee_ids):
        """Set task assignees."""
        if assignee_ids is None:
            return
        users = User.objects.filter(id__in=assignee_ids).distinct()
        task.assignees.set(users)

    def create(self, validated_data):
        """Create a new task with assignees."""
        assignee_ids = validated_data.pop("assignee_ids", [])
        with transaction.atomic():
            task = Task(**validated_data)
            self._set_audit_fields(task, creating=True)
            task.save()
            self._set_assignees(task, assignee_ids)
        return task

    def update(self, instance, validated_data):
        """Update task and manage assignees."""
        assignee_ids = validated_data.pop("assignee_ids", None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        with transaction.atomic():
            self._set_audit_fields(instance, creating=False)
            instance.save()
            self._set_assignees(instance, assignee_ids)
        return instance

