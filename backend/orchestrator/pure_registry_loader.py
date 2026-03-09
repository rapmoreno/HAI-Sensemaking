"""
Module: pure_registry_loader.py
Type: Pure module
Purpose: Load and validate agent registry from YAML

Depends on: None (pure — takes raw data in, returns typed data out)
Used by: effect_agent_executor.py
Side effects: None
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass(frozen=True)
class AgentParams:
    temperature: float = 0.0
    max_tokens: int = 4000
    hardware_provider: Optional[str] = None  # OpenRouter routing: groq, anthropic, etc.


@dataclass(frozen=True)
class AgentEntry:
    id: str
    name: str
    version: str
    enabled: bool
    provider: str
    model: str
    description: str
    tags: tuple[str, ...]
    prompt_file: str
    output_schema: str
    params: AgentParams
    guardrails: tuple[str, ...]


def parse_registry(raw: dict) -> tuple[AgentEntry, ...]:
    """Parse raw YAML dict into typed AgentEntry tuple."""
    agents = raw.get("agents", [])
    entries: list[AgentEntry] = []

    for a in agents:
        params_raw = a.get("params", {})
        entry = AgentEntry(
            id=a["id"],
            name=a["name"],
            version=a["version"],
            enabled=a["enabled"],
            provider=a["provider"],
            model=a["model"],
            description=a["description"],
            tags=tuple(a.get("tags", [])),
            prompt_file=a["prompt_file"],
            output_schema=a["output_schema"],
            params=AgentParams(
                temperature=params_raw.get("temperature", 0.0),
                max_tokens=params_raw.get("max_tokens", 4000),
                hardware_provider=params_raw.get("hardware_provider"),
            ),
            guardrails=tuple(a.get("guardrails", [])),
        )
        entries.append(entry)

    return tuple(entries)


def find_agent(agents: tuple[AgentEntry, ...], agent_id: str) -> Optional[AgentEntry]:
    """Look up agent by id. Returns None if not found or disabled."""
    for a in agents:
        if a.id == agent_id and a.enabled:
            return a
    return None
