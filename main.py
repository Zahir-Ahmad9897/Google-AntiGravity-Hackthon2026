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


@app.get("/api/scenario/{scenario_id}/meta")
async def get_scenario_meta(scenario_id: str):
    meta = {
      "g10_urban_flooding": {
        "scenario_id": "g10_urban_flooding",
        "display_name": "G-10 Urban Flooding",
        "location": "Islamabad, G-10 Sector",
        "crisis_type": "Urban Flooding",
        "description": "Flash flooding in G-10 sector with vehicles stranded and roads blocked.",
        "map_layout_id": "g10_urban_flooding",
        "map_layout": "g10_grid",
        "weather": {
          "condition": "Heavy Rain", "temperature_c": 24,
          "rainfall_mm_hr": 48, "wind_kmh": 32, "is_crisis_factor": True,
          "temp": "24°C", "wind": "32 km/h", "rainfall": "48.0 mm/hr",
          "rainfallMmHr": 48, "windKmh": 32, "temperatureC": 24,
          "isCrisisFactor": True,
          "status": "⚠ CONTRIBUTING TO CRISIS"
        },
        "before_state": {
          "roads_blocked": 3, "vehicles_stranded": 40, "units_deployed": 0, "users_alerted": 0,
          "blocked": 3, "stranded": 40, "units": 0, "alerted": 0, "level": "HIGH",
          "roadsBlocked": 3, "vehiclesStranded": 40, "unitsDeployed": 0, "usersAlerted": 0
        },
        "after_state": {
          "roads_cleared": 2, "vehicles_rerouted": 35, "units_en_route": 2, "users_alerted": 1240,
          "cleared": 2, "rerouted": 35, "units": 2, "alerted": 1240, "level": "MEDIUM",
          "roadsCleared": 2, "vehiclesRerouted": 35, "unitsEnRoute": 2, "usersAlerted": 1240
        }
      },
      "peshawar_ring_road_blast": {
        "scenario_id": "peshawar_ring_road_blast",
        "display_name": "Peshawar Ring Road Blast",
        "location": "Peshawar, Ring Road",
        "crisis_type": "Road Blast & Blockage",
        "description": "Explosion on Ring Road — full closure, emergency response active.",
        "map_layout_id": "peshawar_ring_road_blast",
        "map_layout": "peshawar_ring",
        "weather": {
          "condition": "Partly Cloudy", "temperature_c": 31,
          "rainfall_mm_hr": 0, "wind_kmh": 18, "is_crisis_factor": False,
          "temp": "31°C", "wind": "18 km/h", "rainfall": "0.0 mm/hr",
          "rainfallMmHr": 0, "windKmh": 18, "temperatureC": 31,
          "isCrisisFactor": False,
          "status": "✓ NORMAL CONDITIONS"
        },
        "before_state": {
          "roads_blocked": 1, "vehicles_stranded": 25, "units_deployed": 0, "users_alerted": 0,
          "blocked": 1, "stranded": 25, "units": 0, "alerted": 0, "level": "HIGH",
          "roadsBlocked": 1, "vehiclesStranded": 25, "unitsDeployed": 0, "usersAlerted": 0
        },
        "after_state": {
          "roads_cleared": 1, "vehicles_rerouted": 20, "units_en_route": 4, "users_alerted": 890,
          "cleared": 1, "rerouted": 20, "units": 4, "alerted": 890, "level": "LOW",
          "roadsCleared": 1, "vehiclesRerouted": 20, "unitsEnRoute": 4, "usersAlerted": 890
        }
      },
      "ambulance_rain_congestion": {
        "scenario_id": "ambulance_rain_congestion",
        "display_name": "Ambulance Rain Congestion",
        "location": "Islamabad, City Center",
        "crisis_type": "Emergency Vehicle Blocked",
        "description": "Ambulance stuck in rain-induced congestion — priority corridor needed.",
        "map_layout_id": "ambulance_rain_congestion",
        "map_layout": "city_intersection",
        "weather": {
          "condition": "Thunderstorm", "temperature_c": 21,
          "rainfall_mm_hr": 62, "wind_kmh": 45, "is_crisis_factor": True,
          "temp": "21°C", "wind": "45 km/h", "rainfall": "62.0 mm/hr",
          "rainfallMmHr": 62, "windKmh": 45, "temperatureC": 21,
          "isCrisisFactor": True,
          "status": "⚠ CONTRIBUTING TO CRISIS"
        },
        "before_state": {
          "roads_blocked": 2, "vehicles_stranded": 60, "units_deployed": 1, "users_alerted": 0,
          "blocked": 2, "stranded": 60, "units": 1, "alerted": 0, "level": "HIGH",
          "roadsBlocked": 2, "vehiclesStranded": 60, "unitsDeployed": 1, "usersAlerted": 0
        },
        "after_state": {
          "roads_cleared": 1, "vehicles_rerouted": 50, "units_en_route": 1, "users_alerted": 540,
          "cleared": 1, "rerouted": 50, "units": 1, "alerted": 540, "level": "MEDIUM",
          "roadsCleared": 1, "vehiclesRerouted": 50, "unitsEnRoute": 1, "usersAlerted": 540
        }
      }
    }
    if scenario_id not in meta:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return meta[scenario_id]


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
