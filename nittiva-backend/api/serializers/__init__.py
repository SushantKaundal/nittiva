"""
Serializers package for Nittiva API.

This package contains all DRF serializers organized by domain.
"""

from .user import RegisterSerializer, UserSerializer, GoogleAuthSerializer
from .client import ClientSerializer
from .project import ProjectSerializer, ProjectMemberSerializer
from .task import TaskSerializer, TaskAssignmentSerializer
from .password_reset import PasswordResetRequestSerializer, PasswordResetSerializer
from .invitation import InvitationSerializer, CreateInvitationSerializer, AcceptInvitationSerializer
from .tenant import TenantSerializer
from .goal import GoalSerializer, GoalLinkedEntitySerializer
from .comment import CommentSerializer
from .attachment import AttachmentSerializer
from .time_log import TimeLogSerializer

__all__ = [
    "RegisterSerializer",
    "UserSerializer",
    "GoogleAuthSerializer",
    "ClientSerializer",
    "ProjectSerializer",
    "ProjectMemberSerializer",
    "TaskSerializer",
    "TaskAssignmentSerializer",
    "PasswordResetRequestSerializer",
    "PasswordResetSerializer",
    "InvitationSerializer",
    "CreateInvitationSerializer",
    "AcceptInvitationSerializer",
    "TenantSerializer",
    "GoalSerializer",
    "GoalLinkedEntitySerializer",
    "CommentSerializer",
    "AttachmentSerializer",
    "TimeLogSerializer",
]

