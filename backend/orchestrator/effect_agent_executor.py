"""
Module: effect_agent_executor.py
Type: Effect module
Purpose: Generic agent caller — loads registry, resolves agent, calls provider

Depends on:
  - pure_registry_loader.py (agent lookup)
  - effect_error.py (error handling)
  - config.py (API keys, paths)

Used by:
  - routes/analyse.py

Side effects: HTTP calls to LLM provider, filesystem reads
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

import yaml
from openai import OpenAI

from backend.config import CONFIG
from backend.effect_error import handle_error
from backend.orchestrator.pure_registry_loader import (
    AgentEntry,
    find_agent,
    parse_registry,
)

_registry: Optional[tuple[AgentEntry, ...]] = None
_client: Optional[OpenAI] = None


def _get_registry() -> tuple[AgentEntry, ...]:
    """Load and cache agent registry."""
    global _registry
    if _registry is None:
        path = Path(CONFIG.REGISTRY_PATH)
        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
        _registry = parse_registry(raw)
    return _registry


def _get_client() -> OpenAI:
    """Lazy-init OpenAI client pointing at OpenRouter."""
    global _client
    if _client is None:
        # Agent: canvas_analyser | Provider: openrouter | Called from: effect_agent_executor
        _client = OpenAI(
            base_url=CONFIG.OPENROUTER_BASE_URL,
            api_key=CONFIG.OPENROUTER_API_KEY,
        )
    return _client


def load_prompt(prompt_file: str) -> str:
    """Load prompt markdown from backend/prompts/ directory."""
    path = Path("backend") / prompt_file
    return path.read_text(encoding="utf-8")


def call_agent(agent_id: str, prompt: str) -> str:
    """Execute an agent by registry id with the given prompt.

    Resolves agent config from registry, calls the provider/model
    with registered params, and returns raw response text.

    Raises:
        ValueError: Agent not found or disabled.
        RuntimeError: LLM call failed.
    """
    registry = _get_registry()
    agent = find_agent(registry, agent_id)
    if agent is None:
        raise ValueError(f"Agent '{agent_id}' not found or disabled in registry")

    client = _get_client()

    create_kwargs: dict[str, Any] = {
        "model": agent.model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": agent.params.max_tokens,
        "temperature": agent.params.temperature,
    }
    if agent.params.hardware_provider:
        create_kwargs["extra_body"] = {"provider": {"order": [agent.params.hardware_provider]}}

    try:
        # Agent: {agent_id} | Model: {agent.model} | Called from: call_agent
        response = client.chat.completions.create(**create_kwargs)
        return response.choices[0].message.content or ""

    except Exception as e:
        handle_error(
            severity="ERROR",
            module="effect_agent_executor",
            function="call_agent",
            error=e,
            context={"agent_id": agent_id, "model": agent.model},
        )
        raise RuntimeError(f"LLM call failed for agent '{agent_id}': {e}") from e
