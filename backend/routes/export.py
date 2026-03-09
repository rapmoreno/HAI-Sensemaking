"""
Module: routes/export.py
Type: Effect module (route handler)
Purpose: POST /export endpoint — redirects to Print / Save as PDF

Depends on:
  - effect_error.py (make_http_error)

Used by: main.py (router registration)
Side effects: HTTP response
"""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.effect_error import make_http_error

router = APIRouter()


class ExportRequest(BaseModel):
    canvas_state: Dict[str, Any]
    report: Dict[str, Any]


@router.post("/export")
async def export_pdf(_req: ExportRequest) -> None:
    """Export not available server-side; use Print / Save as PDF in the browser."""
    raise HTTPException(
        status_code=501,
        detail=make_http_error(
            "EXPORT_UNAVAILABLE",
            "Use Print / Save as PDF in your browser instead.",
            501,
        ),
    )
