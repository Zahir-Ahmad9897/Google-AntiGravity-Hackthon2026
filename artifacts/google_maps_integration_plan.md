# Google Maps Integration Plan

Date: 2026-05-18

## Phase 1 Codebase Analysis

### 1. Current Frontend Structure

- `dashboard/index.html` is a single-file vanilla HTML/CSS/JavaScript dashboard.
- It has a left sidebar for scenario control and permission-based Mini Assistant input.
- The main content shows metric cards, the three-iteration agent timeline, decision trace, action plan, simulated actions, artifact viewer, and final report.
- It currently fetches `/api/iterative/scenarios`, posts to `/api/iterative/run`, lists `/api/artifacts`, and reads `/api/artifacts/{filename}`.
- `dashboard/manifest.json` and `dashboard/sw.js` provide PWA support. The service worker caches dashboard shell files and scenario list APIs.
- No map canvas, Google Maps loader, route polylines, weather panel, or route panel exists yet.

### 2. Current Backend Routes

Routes in `main.py`:

- `GET /health`
- `GET /api/scenarios`
- `GET /api/scenarios/{scenario_id}`
- `POST /api/pipeline/run`
- `GET /api/iterative/scenarios`
- `GET /api/iterative/scenarios/{scenario_id}`
- `POST /api/iterative/run`
- `GET /api/artifacts`
- `GET /api/artifacts/{filename}`
- `GET /`
- `GET /manifest.json`
- `GET /sw.js`
- `GET /favicon.ico`

No `/api/config`, map-data, Google weather, Google route, or geocoding endpoints exist yet.

### 3. Current Scenario Execution Flow

- Iterative scenarios are defined in `backend/services/iterative_scenario_store.py`.
- `POST /api/iterative/run` calls `run_iterative_pipeline_by_id()` in `backend/iterative_pipeline.py`.
- The loop runs three steps per scenario:
  Observe -> Verify -> Reason -> Plan -> Act -> Evaluate -> Re-plan.
- Agent orchestration is deterministic Python:
  `CIRO Commander`, `Weather Risk`, `Traffic Analysis`, `Social/Public Signal`, `Verification`, `Crisis Reasoning`, `Rescue Planning`, `Action Execution`, and `Evaluation/Replanning`.
- Legacy consistency checks still run through `backend/agent_pipeline.py`.
- ADK tooling in `adk_ciro/` calls the same deterministic backend functions.

### 4. Current Artifact/Log System

- Artifact helpers live in `backend/services/artifacts.py`.
- `save_artifact()` writes JSON/Markdown into `artifacts/` and prevents path traversal.
- Iterative runs overwrite latest-run evidence files:
  `scenario_input.json`, `human_approval_record.json`, `iteration_1_decision_trace.json`,
  `iteration_2_replan_trace.json`, `iteration_3_final_trace.json`, `risk_score.json`,
  `agent_tool_calls.json`, `rescue_action_plan.md`, and `final_crisis_report.md`.
- Existing artifact style is concise, judge-facing, local, and simulation-first.
- No Google API trace files exist yet.

### 5. Current Map Support Status

- Map support is planned in README but not implemented.
- Current route behavior appears only as text such as "Mock map route updated away from ...".
- No Google Maps JavaScript API script, map container, markers, polylines, Directions/Routes rendering, or before/after toggle exists.

### 6. Current Weather Support Status

- Weather is simulated in scenario data via `WeatherReport`.
- `backend/services/mock_tools.py::get_weather_signal()` returns mock weather from scenario context.
- `Weather Risk Agent` derives severity and confidence from mock rainfall, alert activity, and alert level.
- No Google Weather API service wrapper exists.

### 7. Current Routing Support Status

- Routing is simulated by `Response Planner` and `Execution Simulator`.
- `Response Planner` selects approved demo road targets and alternate route strings.
- `Execution Simulator` records route-update text and simulated before/after traffic speed changes.
- No Google Routes API wrapper exists.
- No route geometry, encoded polyline decoding, ETA, distance, or alternate route API result is currently stored.

### 8. Current Environment Variable Usage

- `.gitignore` already ignores `.env`, `.env.*`, and common credential files while allowing `.env.example`.
- `.env.example` currently includes `GOOGLE_API_KEY` for Gemini/ADK plus optional unused provider keys.
- `.env` exists locally and contains Google key entries, but values were not inspected or copied.
- `adk_ciro/agent.py`, `adk_ciro/run_adk_demo.py`, and `test_gemini_connection.py` load `.env` and use `GOOGLE_API_KEY`.
- No code currently reads `GOOGLE_MAPS_API_KEY`.

### 9. Safe Files to Modify

Minimal safe change set:

- `main.py` for `/api/config` and optional map scenario endpoint.
- `requirements.txt` only if an HTTP client dependency is needed; standard library `urllib` can avoid this.
- `.env.example` to add `GOOGLE_MAPS_API_KEY=your_google_maps_key_here`.
- `backend/services/google_maps.py` as a new service wrapper module.
- `backend/iterative_pipeline.py` to append map/weather/route artifacts after the existing loop.
- `backend/iterative_schemas.py` only if typed response fields are required; avoid unless necessary.
- `dashboard/index.html` for map container, weather panel, route panel, Google Maps loader, markers, polylines, and before/after toggle.
- `dashboard/sw.js` to bump cache version and avoid stale dashboard shell.
- `README.md` to document setup, enabled APIs, fallback mocks, and browser key restrictions.
- `artifacts/google_api_trace.json`, `artifacts/map_route_trace.json`, and `artifacts/weather_signal_trace.json` generated by runtime.

Files to avoid unless required:

- `adk_ciro/agent.py` and `adk_ciro/tools.py`; Google Maps integration can remain a backend/dashboard feature and should not disturb ADK orchestration.
- Existing deterministic agents, except for a small call site in `iterative_pipeline.py` if artifact generation needs scenario/result context.

### 10. Risks Before Google Maps Integration

- Browser Maps JavaScript API needs a public browser key. This is acceptable only if documented and restricted in Google Cloud Console by API restrictions and HTTP referrer/domain restrictions.
- The user-provided key must not be hardcoded, printed, committed, or stored in artifacts.
- Google Weather API request/response fields may differ from mock weather fields, so the wrapper must normalize output and fall back cleanly.
- Google Routes API can fail from missing billing, missing API enablement, region restrictions, quota, invalid field masks, or invalid coordinates.
- Dashboard service worker caching can hide frontend changes unless the cache version is bumped.
- Current scenarios use road names, not coordinates. Geocoding must translate scenario locations and road names before route calls.
- Existing route planning is text-first. Map geometry should be additive and should not replace the deterministic simulation loop.
- Artifacts must summarize API responses, not store full large responses or secrets.
- No real dispatch or emergency action should be implied. All map, weather, and routing updates remain simulation support.
- Current worktree already has modified files; changes must be incremental and preserve those edits.

## Phase 2 Minimal Implementation Steps

1. Add `GOOGLE_MAPS_API_KEY` support:
   - Add placeholder to `.env.example`.
   - Keep `.env` ignored.
   - Load from backend environment only.
   - Add `GET /api/config` returning only the browser-usable Maps key.

2. Add `backend/services/google_maps.py`:
   - `geocode_location(location: str)`.
   - `get_google_weather_signal(location: str, scenario=None)`.
   - `get_google_route_data(origin, destination, blocked_route=None)`.
   - Normalize all outputs into compact dictionaries.
   - Use mock fallback when key/API/network/request fails.

3. Add Google API trace logging:
   - Append or rewrite concise latest-run records in `artifacts/google_api_trace.json`.
   - Record timestamp, API name, sanitized input, success/failure, summarized output, and `fallback_used`.
   - Never log API keys or full request URLs containing keys.

4. Generate scenario map payloads:
   - Map scenario IDs to origin, destination, incident location, blocked route, alternate target, and marker labels.
   - Generate `artifacts/map_route_trace.json` and `artifacts/weather_signal_trace.json` during iterative scenario runs.
   - Include enough fallback geometry for dashboard rendering if Google APIs fail.

5. Update dashboard map:
   - Add a map section with a stable-height `#map`.
   - Fetch `/api/config`, load Maps JavaScript API dynamically, and initialize the map.
   - Render crisis marker, blocked route in red, alternate route in green, ambulance/rescue marker, and weather risk marker.
   - Add before/after toggle:
     Before shows crisis marker, weather marker, and red blocked route.
     After shows green alternate route and dispatch/rescue path.

6. Add Weather Intelligence panel:
   - Show location, condition, precipitation/rainfall, risk level, confidence, and source.
   - Display mock fallback source when Google Weather API is unavailable.

7. Add Route Intelligence panel:
   - Show blocked route, alternate route, ETA, distance, rerouting reason, and source.
   - Preserve existing simulated action text.

8. Connect scenarios:
   - `g10_urban_flooding`: G-10 Islamabad incident, flooding marker, blocked G-10 route, green alternate.
   - `peshawar_ring_road_blast`: Peshawar Ring Road incident, blocked route, alternate around closure.
   - `ambulance_rain_congestion`: ambulance marker, congested route, emergency alternate route.

9. Update README:
   - Add Google Maps setup, enabled APIs, `.env` variables, Weather/Routes/Geocoding usage, fallback behavior, and safety note.
   - Document browser key restriction requirements for Maps JavaScript API.

10. Verify:
   - Run `python -m uvicorn main:app --reload --host 127.0.0.1 --port 8080`.
   - Open dashboard.
   - Run Islamabad G-10 flooding.
   - Confirm map display, red blocked route before response, green alternate route after response, weather panel, route panel, and artifacts.
