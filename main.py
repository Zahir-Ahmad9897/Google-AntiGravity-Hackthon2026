from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response
from pydantic import BaseModel

from backend.agent_pipeline import run_pipeline_by_id
from backend.iterative_pipeline import run_iterative_pipeline_by_id
from backend.services.artifacts import list_artifacts, read_artifact
from backend.services.iterative_scenario_store import get_iterative_scenario, list_iterative_scenarios
from backend.services.scenario_store import get_scenario, list_scenarios


BASE_DIR = Path(__file__).resolve().parent
DASHBOARD_PATH = BASE_DIR / "dashboard" / "index.html"


class PipelineRunRequest(BaseModel):
    scenario_id: str


app = FastAPI(
    title="CIRO Crisis Intelligence API",
    description="FastAPI wrapper for the CIRO multi-agent crisis pipeline.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/scenarios")
def api_scenarios() -> list[dict]:
    return [scenario.model_dump(mode="json") for scenario in list_scenarios()]


@app.get("/api/scenarios/{scenario_id}")
def api_scenario(scenario_id: str) -> dict:
    try:
        scenario = get_scenario(scenario_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return scenario.model_dump(mode="json")


@app.post("/api/pipeline/run")
def api_run_pipeline(request: PipelineRunRequest) -> dict:
    try:
        result = run_pipeline_by_id(request.scenario_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logging.exception("Pipeline execution failed for scenario %s", request.scenario_id)
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline error: {type(exc).__name__}: {exc}",
        ) from exc
    return result.model_dump(mode="json")


@app.get("/api/iterative/scenarios")
def api_iterative_scenarios() -> list[dict]:
    return [scenario.model_dump(mode="json") for scenario in list_iterative_scenarios()]


@app.get("/api/iterative/scenarios/{scenario_id}")
def api_iterative_scenario(scenario_id: str) -> dict:
    try:
        scenario = get_iterative_scenario(scenario_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return scenario.model_dump(mode="json")


@app.post("/api/iterative/run")
def api_run_iterative_pipeline(request: PipelineRunRequest) -> dict:
    try:
        result = run_iterative_pipeline_by_id(request.scenario_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logging.exception("Iterative pipeline execution failed for scenario %s", request.scenario_id)
        raise HTTPException(
            status_code=500,
            detail=f"Iterative pipeline error: {type(exc).__name__}: {exc}",
        ) from exc
    return result.model_dump(mode="json")


@app.get("/api/artifacts")
def api_artifacts() -> list[dict]:
    return list_artifacts()


@app.get("/api/artifacts/{filename}")
def api_artifact(filename: str) -> Response:
    try:
        content = read_artifact(filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=f"Artifact not found: {filename}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    media_type = "application/json" if filename.endswith(".json") else "text/markdown"
    return Response(content=content, media_type=media_type)


@app.get("/", response_class=HTMLResponse)
def dashboard() -> FileResponse:
    if not DASHBOARD_PATH.exists():
        raise HTTPException(status_code=404, detail="Dashboard file not found.")
    return FileResponse(DASHBOARD_PATH, media_type="text/html")


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(content=b"", media_type="image/x-icon", status_code=204)
