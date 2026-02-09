"""
Views package for Nittiva API.

This package contains all API views organized by domain.
"""

from .auth import LoginView, register, healthz, readyz, google_auth
from .user import UserViewSet
from .client import ClientViewSet
from .project import ProjectViewSet
from .task import TaskViewSet
from .password_reset import request_password_reset, reset_password
from .dashboard import dashboard_statistics

__all__ = [
    "LoginView",
    "register",
    "healthz",
    "readyz",
    "google_auth",
    "request_password_reset",
    "reset_password",
    "dashboard_statistics",
    "UserViewSet",
    "ClientViewSet",
    "ProjectViewSet",
    "TaskViewSet",
]

