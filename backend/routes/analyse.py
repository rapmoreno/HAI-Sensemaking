"""
Module: routes/analyse.py
Type: Effect module (route handler)
Purpose: POST /analyse endpoint — run dimension analysis on process steps

Depends on:
  - orchestrator/effect_agent_executor.py (call_agent, load_prompt)
  - effect_error.py (handle_error, make_http_error)
  - config.py (DIMENSIONS_PATH)

Used by: main.py (router registration)
Side effects: HTTP response, LLM API call
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.config import CONFIG
from backend.effect_error import handle_error, make_http_error
from backend.orchestrator.effect_agent_executor import call_agent, load_prompt

router = APIRouter()

AGENT_ID = "canvas_analyser"


class StepInput(BaseModel):
    id: str
    title: str
    description: str
    ownership: str
    branch_context: Optional[str] = None


class AnalyseRequest(BaseModel):
    process_name: str
    context_description: str
    context_type: str
    steps: List[StepInput]


def _load_dimensions() -> List[Dict[str, Any]]:
    """Load dimensions config from JSON file."""
    path = Path(CONFIG.DIMENSIONS_PATH)
    data = json.loads(path.read_text(encoding="utf-8"))
    return data["dimensions"]


def _build_prompt(req: AnalyseRequest, dimensions: List[Dict[str, Any]]) -> str:
    """Inject process context and dimensions into prompt template."""
    template = load_prompt("prompts/analyse.md")

    steps_text = ""
    for s in req.steps:
        branch_ctx = f" [Branch: {s.branch_context}]" if s.branch_context else ""
        steps_text += f"- **{s.id}**{branch_ctx} | Title: {s.title} | Description: {s.description} | Current ownership: {s.ownership}\n"

    dims_text = ""
    for d in dimensions:
        vals = ", ".join(d["values"])
        dims_text += f"- **{d['id']}** ({d['label']}): {d['ai_instruction']} Allowed values: [{vals}]\n"

    prompt = template.replace("{{process_name}}", req.process_name)
    prompt = prompt.replace("{{context_description}}", req.context_description)
    prompt = prompt.replace("{{context_type}}", req.context_type)
    prompt = prompt.replace("{{steps}}", steps_text)
    prompt = prompt.replace("{{dimensions}}", dims_text)

    return prompt


def _extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON object from LLM response, stripping markdown fences."""
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


@router.post("/analyse")
async def analyse(req: AnalyseRequest) -> Dict[str, Any]:
    """Run canvas_analyser agent on process steps."""
    dimensions = _load_dimensions()
    prompt = _build_prompt(req, dimensions)

    # Agent: canvas_analyser | Model: from registry | Called from: routes/analyse.py
    try:
        raw = call_agent(AGENT_ID, prompt)
    except (ValueError, RuntimeError) as e:
        handle_error("ERROR", "routes.analyse", "analyse", e)
        raise HTTPException(status_code=502, detail=make_http_error("LLM_FAILED", str(e), 502))

    try:
        result = _extract_json(raw)
    except (json.JSONDecodeError, ValueError) as e:
        handle_error("WARN", "routes.analyse", "analyse", e, {"raw_preview": raw[:300]})
        raise HTTPException(
            status_code=422,
            detail=make_http_error("MALFORMED_JSON", f"LLM returned malformed JSON: {e}", 422),
        )

    return result
