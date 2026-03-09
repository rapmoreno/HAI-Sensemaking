"""
Module: config.py
Type: Config
Purpose: Application configuration via frozen dataclass

Depends on: None
Used by: main.py, orchestrator modules
Side effects: Reads environment variables, loads .env
"""
from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    APP_NAME: str = "HAI Sensemaking Canvas"
    PORT: int = int(os.environ.get("PORT", "8731"))
    OPENROUTER_API_KEY: str = os.environ.get("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    REGISTRY_PATH: str = "agents/registry.yaml"
    DIMENSIONS_PATH: str = "backend/config/dimensions.json"


CONFIG = Config()
