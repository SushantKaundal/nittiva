"""
Permissions package for Nittiva API.

This package contains custom permission classes.
"""

from .custom import IsAdminOrReadOnly

__all__ = [
    "IsAdminOrReadOnly",
]

