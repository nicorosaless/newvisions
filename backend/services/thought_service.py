"""Deprecated duplicate module. Use backend.services.content.thought_service instead."""

from backend.services.content.thought_service import generate_thought  # re-export for backward compatibility

__all__ = ["generate_thought"]
