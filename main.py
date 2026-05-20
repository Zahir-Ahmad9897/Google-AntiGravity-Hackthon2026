from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.agent_pipeline import run_pipeline_by_id
from backend.iterative_pipeline import run_iterative_pipeline, run_iterative_pipeline_by_id
from backend.services.artifacts import list_artifacts, read_artifact, save_artifact
from backend.services.google_maps import get_route_update, get_weather_update
from backend.services.iterative_scenario_store import get_iterative_scenario, list_iterative_scenarios
from backend.services.mini_assistant import build_custom_iterative_scenario, extract_crisis_signal
from backend.services.scenario_store import get_scenario, list_scenarios


BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
DASHBOARD_DIR = BASE_DIR / "dashboard"
DASHBOARD_PATH = DASHBOARD_DIR / "index.html"
MANIFEST_PATH = DASHBOARD_DIR / "manifest.json"
SERVICE_WORKER_PATH = DASHBOARD_DIR / "sw.js"

load_dotenv(dotenv_path=ENV_PATH)


class PipelineRunRequest(BaseModel):
    scenario_id: str


class MiniAssistantExtractRequest(BaseModel):
    text: str
    source: str = "User report"
    location: str = ""
    permission_granted: bool = False


class CustomPipelineRunRequest(MiniAssistantExtractRequest):
    severity: str = "Medium"


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

app.mount("/dashboard", StaticFiles(directory=DASHBOARD_DIR), name="dashboard")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/config")
def api_config() -> dict[str, object]:
    maps_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
    return {
        "maps_enabled": bool(maps_key),
        "has_google_maps_key": bool(maps_key),
        "google_maps_public_browser_key": maps_key,
        "key_security_note": "Restrict this browser key by Maps APIs and HTTP referrers in Google Cloud Console.",
    }


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


@app.get("/api/weather")
def api_weather(location: str = Query(..., min_length=1)) -> dict:
    return get_weather_update(location)


@app.get("/api/route")
def api_route(
    origin: str = Query(..., min_length=1),
    destination: str = Query(..., min_length=1),
    blocked_area: str | None = Query(default=None),
) -> dict:
    return get_route_update(origin, destination, blocked_area)


@app.post("/api/mini-assistant/extract")
def api_mini_assistant_extract(request: MiniAssistantExtractRequest) -> dict:
    signal = extract_crisis_signal(
        text=request.text,
        source=request.source,
        location=request.location,
        permission_granted=request.permission_granted,
    )
    save_artifact("mini_assistant_signal.json", signal)
    return signal


@app.post("/api/iterative/run-custom")
def api_run_custom_iterative_pipeline(request: CustomPipelineRunRequest) -> dict:
    signal = extract_crisis_signal(
        text=request.text,
        source=request.source,
        location=request.location,
        permission_granted=request.permission_granted,
    )
    save_artifact("mini_assistant_signal.json", signal)
    if not signal.get("is_crisis_related"):
        raise HTTPException(status_code=400, detail="No emergency signal detected.")
    try:
        scenario = build_custom_iterative_scenario(
            signal=signal,
            text=request.text,
            source=request.source,
            severity=request.severity,
        )
        result = run_iterative_pipeline(scenario, custom_signal=signal)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logging.exception("Custom iterative pipeline execution failed")
        raise HTTPException(
            status_code=500,
            detail=f"Custom iterative pipeline error: {type(exc).__name__}: {exc}",
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


@app.get("/manifest.json", include_in_schema=False)
def manifest() -> FileResponse:
    if not MANIFEST_PATH.exists():
        raise HTTPException(status_code=404, detail="Manifest file not found.")
    return FileResponse(MANIFEST_PATH, media_type="application/manifest+json")


@app.get("/sw.js", include_in_schema=False)
def service_worker() -> FileResponse:
    if not SERVICE_WORKER_PATH.exists():
        raise HTTPException(status_code=404, detail="Service worker file not found.")
    return FileResponse(
        SERVICE_WORKER_PATH,
        media_type="application/javascript",
        headers={"Cache-Control": "no-cache"},
    )


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(content=b"", media_type="image/x-icon", status_code=204)
