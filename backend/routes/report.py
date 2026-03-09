"""
Module: routes/report.py
Type: Effect module (route handler)
Purpose: POST /report endpoint — generate structured report from analysed canvas

Depends on:
  - orchestrator/effect_agent_executor.py (call_agent, load_prompt)
  - effect_error.py (handle_error, make_http_error)

Used by: main.py (router registration)
Side effects: HTTP response, LLM API call
"""
from __future__ import annotations

import json
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.effect_error import handle_error, make_http_error
from backend.orchestrator.effect_agent_executor import call_agent, load_prompt

router = APIRouter()

AGENT_ID = "report_generator"


class ReportRequest(BaseModel):
    canvas_state: Dict[str, Any]


def _build_prompt(canvas_state: Dict[str, Any]) -> str:
    """Inject canvas state into report prompt template."""
    template = load_prompt("prompts/report.md")
    canvas_json = json.dumps(canvas_state, indent=2)
    return template.replace("{{canvas_data}}", canvas_json)


def _extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON object from LLM response."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        text = "\n".join(lines)
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON object found in response")
    return json.loads(text[start:end])


@router.post("/report")
async def report(req: ReportRequest) -> Dict[str, Any]:
    """Run report_generator agent on analysed canvas state."""
    prompt = _build_prompt(req.canvas_state)

    # Agent: report_generator | Model: from registry | Called from: routes/report.py
    try:
        raw = call_agent(AGENT_ID, prompt)
    except (ValueError, RuntimeError) as e:
        handle_error("ERROR", "routes.report", "report", e)
        raise HTTPException(status_code=502, detail=make_http_error("LLM_FAILED", str(e), 502))

    try:
        result = _extract_json(raw)
    except (json.JSONDecodeError, ValueError) as e:
        handle_error("WARN", "routes.report", "report", e, {"raw_preview": raw[:300]})
        raise HTTPException(
            status_code=422,
            detail=make_http_error("MALFORMED_JSON", f"LLM returned malformed JSON: {e}", 422),
        )

    return result
