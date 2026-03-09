"""
Module: effect_error.py
Type: Effect module
Purpose: Centralized error handler for all backend effect modules

Depends on: None
Used by: All effect modules, all routes
Side effects: Logging
"""
from __future__ import annotations

import logging
import traceback
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger("hai_canvas")


def handle_error(
    severity: str,
    module: str,
    function: str,
    error: Exception,
    context: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Log structured error and return error dict."""
    error_dict = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "severity": severity,
        "module": module,
        "function": function,
        "error": str(error),
        "stack": traceback.format_exc(),
        "context": _redact(context) if context else None,
    }

    if severity == "FATAL":
        logger.critical(str(error_dict))
    elif severity == "ERROR":
        logger.error(str(error_dict))
    elif severity == "WARN":
        logger.warning(str(error_dict))
    else:
        logger.info(str(error_dict))

    return error_dict


def make_http_error(code: str, message: str, status: int) -> dict[str, Any]:
    """Create wire-format error response."""
    return {
        "error": True,
        "code": code,
        "message": message,
        "status": status,
    }


def _redact(data: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    """Remove sensitive keys from context before logging."""
    if data is None:
        return None
    sensitive = {"api_key", "token", "password", "secret", "authorization"}
    return {k: "***REDACTED***" if k.lower() in sensitive else v for k, v in data.items()}
