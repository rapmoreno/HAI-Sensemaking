"""
Module: main.py
Type: Entry point
Purpose: FastAPI app, CORS, static mount, route registration

Depends on:
  - routes/analyse.py
  - config.py

Used by: uvicorn
Side effects: HTTP server
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from backend.config import CONFIG
from backend.routes.analyse import router as analyse_router
from backend.routes.report import router as report_router
from backend.routes.export import router as export_router

load_dotenv()

app = FastAPI(title=CONFIG.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API sub-app mounted at /api/v1 so it’s checked before static handler (avoids 405)
api_v1 = FastAPI(title=f"{CONFIG.APP_NAME} API")
api_v1.include_router(analyse_router)
api_v1.include_router(report_router)
api_v1.include_router(export_router)
app.mount("/api/v1", api_v1)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
