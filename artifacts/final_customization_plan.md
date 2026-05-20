# CIRO Final Customization Plan

Generated: 2026-05-19

## 1. Current Frontend Structure

- `dashboard/index.html` is a single-file vanilla HTML/CSS/JavaScript dashboard.
- It currently includes predefined scenario control, an iterative pipeline run button, a prototype CIRO Mini Assistant, metric cards, an agent timeline, decision trace, action plan, simulated actions, artifact viewer, final report, Google map panel, weather panel, and route panel.
- `dashboard/manifest.json`, `dashboard/sw.js`, and `dashboard/icons/` provide installable PWA support.

## 2. Current Backend Routes

- `GET /health`
- `GET /api/config`
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

Missing before implementation:

- `GET /api/weather`
- `GET /api/route`
- `POST /api/mini-assistant/extract`
- `POST /api/iterative/run-custom`

## 3. Current Scenario Flow

- Predefined three-step scenarios live in `backend/services/iterative_scenario_store.py`.
- `backend/iterative_pipeline.py` runs the CIRO Commander loop across three iterations.
- Each iteration follows Observe, Verify, Reason, Plan, Act, Evaluate, and Re-plan through deterministic agent wrappers.
- Legacy one-pass execution is preserved in `backend/agent_pipeline.py`.

## 4. Current Artifact/Log System

- `backend/services/artifacts.py` safely reads, writes, and lists files inside `artifacts/`.
- Iterative runs write scenario input, human approval, iteration traces, tool calls, risk score, action plan, final crisis report, Google API trace, map route trace, and weather trace.
- Google API traces are sanitized summaries and do not store API keys.

## 5. Current ADK/Gemini Usage

- `adk_ciro/agent.py` configures a Google ADK root agent with Gemini model selection through `CIRO_ADK_MODEL`.
- `adk_ciro/tools.py` exposes backend pipeline functions as ADK tools.
- `adk_ciro/run_adk_demo.py` runs a terminal proof and optionally uses Gemini narration when `GOOGLE_API_KEY` is present.
- Core scoring and artifact generation remain deterministic Python logic.

## 6. Current PWA Status

- `dashboard/manifest.json` exists with app name `CIRO Crisis Intelligence`, standalone display mode, theme color, icons, and scope.
- `dashboard/sw.js` caches the dashboard shell and scenario APIs.
- `dashboard/index.html` registers the service worker and exposes an install prompt button.

## 7. Current Map Support Status

- `backend/services/google_maps.py` has Geocoding, Weather, and Routes wrappers with fallback mocks.
- The dashboard loads Google Maps JavaScript through `/api/config` and renders crisis, weather, rescue markers, red blocked route, and green alternate route.
- Before implementation, `/api/config` returned a raw Maps key field; implementation should expose any browser key only as a restricted public browser Maps key.

## 8. Current Weather Support Status

- Scenario weather is available through mock PMD-style data in scenario definitions.
- `backend/services/google_maps.py` can call Google Weather API current conditions when `GOOGLE_MAPS_API_KEY` is present.
- Fallback weather uses existing mock scenario data.

## 9. Current Routing Support Status

- Scenario route visualization is generated in `backend/services/google_maps.py`.
- Google Routes API can be used when a key is present.
- If Google Routes fails or the key is missing, mock geometry is used for original/blocked and alternate routes.

## 10. Safe Files To Modify

- `.env.example`
- `.gitignore`
- `README.md`
- `main.py`
- `backend/iterative_pipeline.py`
- `backend/services/google_maps.py`
- New additive service modules under `backend/services/`
- `dashboard/index.html`
- `dashboard/sw.js`
- `dashboard/manifest.json` if app metadata needs minor correction
- Additive artifacts under `artifacts/`

## 11. Risks Before Implementation

- `.gitignore` currently contains a broad `*.md` ignore rule, which can hide required judge evidence such as artifact markdown and repo documentation.
- `.env.example` does not exactly match the requested placeholder-only submission format.
- Mini Assistant is currently frontend-only and does not write requested backend artifacts.
- Missing weather, route, extraction, and custom pipeline endpoints.
- Browser map rendering requires a public Maps JavaScript key; this key must be restricted by HTTP referrer and API restrictions in Google Cloud Console.
- ADK tools still include a simulated screen-signal helper name; documentation and UI must avoid implying background screen monitoring.
- All new features must preserve simulation-only behavior and must not contact real emergency systems or scrape social platforms.
