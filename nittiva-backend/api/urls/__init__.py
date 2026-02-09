"""
URLs package for Nittiva API.

This package contains all URL routing organized by domain.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from ..views import (
    LoginView,
    register,
    google_auth,
    request_password_reset,
    reset_password,
    dashboard_statistics,
    UserViewSet,
    ClientViewSet,
    ProjectViewSet,
    TaskViewSet,
    healthz,
    readyz,
)

# Create router for viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')

# Main URL patterns
urlpatterns = [
    # Authentication
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/register', register, name='register'),
    path('auth/google', google_auth, name='google_auth'),
    
    # Password Reset
    path('password/email', request_password_reset, name='request_password_reset'),
    path('password/reset', reset_password, name='reset_password'),
    
    # Dashboard
    path('dashboard/statistics', dashboard_statistics, name='dashboard_statistics'),

    # Health checks
    path('healthz', healthz, name='healthz'),
    path('readyz', readyz, name='readyz'),

    # Viewsets
    path('', include(router.urls)),
]

