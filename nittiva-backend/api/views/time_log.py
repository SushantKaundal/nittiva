"""
Time log views.

This module contains viewsets for time log management.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta

from ..models import TimeLog, Task
from ..serializers import TimeLogSerializer
from ..utils.tenant import get_current_tenant_id
from ..utils.responses import success_response, error_response


class TimeLogViewSet(viewsets.ModelViewSet):
    """ViewSet for time log management."""
    
    serializer_class = TimeLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        user = self.request.user
        qs = TimeLog.objects.filter(tenant_id=tenant_id)
        
        # Filter by task if provided
        task_id = self.request.query_params.get("task")
        if task_id:
            qs = qs.filter(task_id=task_id)
        
        # Filter by user if not admin
        if not (user.is_staff or user.is_superuser):
            qs = qs.filter(user=user)
        
        # Filter by date range
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date:
            qs = qs.filter(started_at__gte=start_date)
        if end_date:
            qs = qs.filter(started_at__lte=end_date)
        
        return qs.order_by("-started_at")
    
    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)
    
    @action(detail=False, methods=["post"])
    def start_timer(self, request):
        """Start a timer for a task."""
        task_id = request.data.get("task_id")
        if not task_id:
            return error_response(
                "task_id is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        # Check if user already has an active timer
        active_timer = TimeLog.objects.filter(
            tenant_id=tenant_id,
            user=request.user,
            ended_at__isnull=True
        ).first()
        
        if active_timer:
            return error_response(
                "You already have an active timer. Please stop it first.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new time log
        time_log = TimeLog.objects.create(
            tenant_id=tenant_id,
            task_id=task_id,
            user=request.user,
            started_at=timezone.now(),
            is_manual=False
        )
        
        return success_response(
            data=TimeLogSerializer(time_log).data,
            message="Timer started"
        )
    
    @action(detail=True, methods=["post"])
    def stop_timer(self, request, pk=None):
        """Stop a timer."""
        time_log = self.get_object()
        
        if time_log.ended_at:
            return error_response(
                "Timer is already stopped",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        time_log.ended_at = timezone.now()
        time_log.save()
        
        # Update task's total time
        task = time_log.task
        task.time_tracked_seconds = TimeLog.objects.filter(
            tenant_id=task.tenant_id,
            task=task
        ).aggregate(total=Sum("duration_seconds"))["total"] or 0
        task.save(update_fields=["time_tracked_seconds"])
        
        return success_response(
            data=TimeLogSerializer(time_log).data,
            message="Timer stopped"
        )
    
    @action(detail=False, methods=["get"])
    def active_timer(self, request):
        """Get active timer for current user."""
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        active_timer = TimeLog.objects.filter(
            tenant_id=tenant_id,
            user=request.user,
            ended_at__isnull=True
        ).first()
        
        if active_timer:
            return success_response(
                data=TimeLogSerializer(active_timer).data
            )
        else:
            return success_response(data=None, message="No active timer")
    
    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Get time tracking summary."""
        tenant_id = get_current_tenant_id(request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        
        user = request.user
        qs = TimeLog.objects.filter(tenant_id=tenant_id)
        
        if not (user.is_staff or user.is_superuser):
            qs = qs.filter(user=user)
        
        # Total time
        total_seconds = qs.aggregate(total=Sum("duration_seconds"))["total"] or 0
        
        # Time by task
        task_summary = qs.values("task__id", "task__title").annotate(
            total_seconds=Sum("duration_seconds")
        ).order_by("-total_seconds")[:10]
        
        # Time by user (if admin)
        user_summary = None
        if user.is_staff or user.is_superuser:
            user_summary = qs.values("user__id", "user__name", "user__email").annotate(
                total_seconds=Sum("duration_seconds")
            ).order_by("-total_seconds")[:10]
        
        return success_response(
            data={
                "total_seconds": total_seconds,
                "total_hours": round(total_seconds / 3600, 2),
                "task_summary": list(task_summary),
                "user_summary": list(user_summary) if user_summary else None,
            }
        )
