"""
Django admin configuration for Nittiva API.

This module registers all models with the Django admin interface.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    User,
    Client,
    Project,
    ProjectMember,
    Task,
    TaskAssignment,
)

# -----------------------------
# User
# -----------------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""

    ordering = ("email",)
    list_display = ("email", "name", "role", "is_active", "is_staff", "created_at")
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    search_fields = ("email", "name")

    readonly_fields = ("created_at", "updated_at", "last_login")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Info", {"fields": ("name", "role")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "name",
                    "role",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

    filter_horizontal = ("groups", "user_permissions")


# -----------------------------
# Client
# -----------------------------
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Admin configuration for Client model."""

    list_display = ("name", "owner", "company", "email", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "company", "email", "phone")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("owner",)


# -----------------------------
# Project + Members Inline
# -----------------------------
class ProjectMemberInline(admin.TabularInline):
    """Inline admin for ProjectMember."""

    model = ProjectMember
    extra = 0
    autocomplete_fields = ("user",)
    fields = ("user", "role", "joined_at")
    readonly_fields = ("joined_at",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin configuration for Project model."""

    list_display = ("name", "owner", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "description", "owner__email")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("owner", "client")
    inlines = [ProjectMemberInline]
    ordering = ("-created_at",)


# -----------------------------
# Task + Assignees Inline
# -----------------------------
class TaskAssignmentInline(admin.TabularInline):
    """Inline admin for TaskAssignment."""

    model = TaskAssignment
    extra = 0
    autocomplete_fields = ("user",)
    fields = ("user", "assigned_at")
    readonly_fields = ("assigned_at",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin configuration for Task model."""

    list_display = (
        "title",
        "project",
        "status",
        "priority",
        "progress",
        "due_date",
        "created_at",
    )
    list_filter = ("status", "priority", "project")
    search_fields = ("title", "description", "project__name")
    readonly_fields = ("created_at", "updated_at")
    autocomplete_fields = ("project", "created_by", "updated_by")
    inlines = [TaskAssignmentInline]
    ordering = ("-created_at",)


# -----------------------------
# Project Member
# -----------------------------
@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    """Admin configuration for ProjectMember model."""

    list_display = ("project", "user", "role", "joined_at")
    list_filter = ("role",)
    search_fields = ("project__name", "user__email")
    autocomplete_fields = ("project", "user")
    readonly_fields = ("joined_at",)


# -----------------------------
# Task Assignment
# -----------------------------
@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin):
    """Admin configuration for TaskAssignment model."""

    list_display = ("task", "user", "assigned_at")
    search_fields = ("task__title", "user__email")
    autocomplete_fields = ("task", "user")
    readonly_fields = ("assigned_at",)
