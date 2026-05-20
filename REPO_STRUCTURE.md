# CIRO Repository Tree And Summary

Generated: 2026-05-19

This document summarizes the current CIRO repository after the Google Maps Platform integration work. Local runtime/cache directories are summarized instead of expanded. Secret files are listed only by filename; values are intentionally not documented.

## High-Level Summary

CIRO is a FastAPI + Google ADK crisis-response orchestration prototype. The backend keeps the primary intelligence workflow in deterministic Python agents, the ADK layer exposes those workflows to Gemini/ADK tools, and the dashboard provides a vanilla HTML/CSS/JS command center.

Current runtime flow:

```text
Dashboard or ADK tool
-> FastAPI route
-> Scenario store
-> Iterative CIRO Commander pipeline
-> Deterministic agent modules
-> Mock/Google service wrappers
-> Artifacts under artifacts/
-> Dashboard panels, map, trace, and report
```

Core design intent:

- Preserve the existing CIRO multi-agent architecture.
- Keep all emergency actions simulation-only.
- Use Google Maps Platform only for contextual map/weather/routing intelligence.
- Keep fallback mocks available when Google APIs or keys are unavailable.
- Save judge-readable evidence under `artifacts/`.

## Detailed Tree

```text
D:\Antigravity_Hackthon
|-- .adk/
|   `-- artifacts/                         # Local ADK/Antigravity runtime artifacts, not app source.
|-- .git/                                  # Git metadata.
|-- .tools/                                # Local tool/runtime support directory.
|-- .venv/                                 # Local Python virtual environment.
|-- __pycache__/                           # Python bytecode cache.
|-- adk_ciro/
|   |-- __init__.py                        # ADK package marker.
|   |-- agent.py                           # Google ADK root agent setup, model selection, CIRO instruction.
|   |-- run_adk_demo.py                    # Terminal demo for ADK/Gemini-backed CIRO orchestration.
|   `-- tools.py                           # ADK tool wrappers delegating to backend pipeline functions.
|-- archive/
|   `-- ARCHIVED_FILES.md                  # Notes for archived/non-critical files.
|-- artifacts/
|   |-- agent_tool_calls.json              # Latest iterative run tool-call style trace.
|   |-- codebase_analysis.md               # Prior repository analysis artifact.
|   |-- custom_iteration_trace.json        # Latest custom approved-input iterative run trace.
|   |-- custom_scenario_input.json         # Latest custom scenario built from Mini Assistant input.
|   |-- final_customization_plan.md        # Final hackathon implementation analysis and plan.
|   |-- final_crisis_report.md             # Latest generated crisis report.
|   |-- google_api_trace.json              # Sanitized Google API call/fallback trace.
|   |-- google_maps_integration_plan.md    # Pre-integration analysis and Google Maps implementation plan.
|   |-- human_approval_record.json         # Simulated human approval record.
|   |-- iteration_1_decision_trace.json    # Iteration 1 decision trace.
|   |-- iteration_2_replan_trace.json      # Iteration 2 replan trace.
|   |-- iteration_3_final_trace.json       # Iteration 3 final trace.
|   |-- map_route_trace.json               # Latest map markers, blocked route, alternate route, route panel data.
|   |-- mini_assistant_signal.json         # Latest permission-based extracted crisis signal.
|   |-- rescue_action_plan.md              # Human-readable simulated response plan.
|   |-- risk_score.json                    # Latest risk/confidence score summary.
|   |-- scenario_input.json                # Latest scenario definition used by the run.
|   `-- weather_signal_trace.json          # Latest normalized weather intelligence artifact.
|-- backend/
|   |-- __init__.py                        # Backend package marker.
|   |-- agent_pipeline.py                  # Legacy one-pass deterministic pipeline runner.
|   |-- iterative_pipeline.py              # Three-iteration CIRO Commander orchestration and artifact generation.
|   |-- iterative_schemas.py               # Pydantic schemas for iterative traces/results/approval/tool calls.
|   |-- schemas.py                         # Core Pydantic domain models: signals, scenarios, plans, execution, impact.
|   |-- agents/
|   |   |-- __init__.py                    # Agent package marker.
|   |   |-- crisis_detector.py             # Clusters signals, computes confidence band/escalation.
|   |   |-- execution_simulator.py         # Simulates planned actions and state changes only.
|   |   |-- impact_reporter.py             # Produces before/after impact and remaining risk summary.
|   |   |-- iterative_agents.py            # Named CIRO iterative agent wrappers.
|   |   |-- response_planner.py            # Builds simulated dispatch, reroute, alert, shelter actions.
|   |   |-- signal_watcher.py              # Extracts structured crisis signals from scenario inputs.
|   |   `-- situation_analyst.py           # Determines situation, affected roads, risks, severity.
|   `-- services/
|       |-- __init__.py                    # Services package marker.
|       |-- artifacts.py                   # Safe artifact read/write/list helpers.
|       |-- confidence.py                  # Confidence formula and escalation helpers.
|       |-- google_maps.py                 # Geocoding, Weather, Routes wrappers with mock fallback and tracing.
|       |-- iterative_scenario_store.py    # Three-step demo scenarios used by CIRO Commander.
|       |-- mini_assistant.py              # Permission-based custom crisis signal extraction and scenario builder.
|       |-- mock_tools.py                  # Mock weather/traffic/public reports, verification, risk helpers.
|       `-- scenario_store.py              # Legacy one-pass demo scenarios.
|-- dashboard/
|   |-- icons/
|   |   |-- icon-192.png                   # PWA icon.
|   |   `-- icon-512.png                   # PWA icon.
|   |-- index.html                        # Dashboard UI, scenario runner, map, weather/route panels, artifact viewer.
|   |-- manifest.json                     # PWA manifest.
|   `-- sw.js                             # Service worker/cache shell.
|-- mobile/
|   |-- App.tsx                           # Expo app entry point.
|   |-- app.json                          # Expo app metadata.
|   |-- package.json                      # React Native/Expo dependencies and scripts.
|   |-- README.md                         # Mobile app setup and demo notes.
|   |-- tsconfig.json                     # Mobile TypeScript config.
|   `-- src/
|       |-- components/                    # Reusable field officer UI components.
|       |-- data/                          # Mock fallback data.
|       |-- navigation/                    # Stack and tab navigation.
|       |-- screens/                       # Field officer app screens.
|       |-- services/                      # CIRO backend API adapter.
|       |-- state/                         # App state provider.
|       |-- theme/                         # Shared colors.
|       |-- types/                         # API/navigation types.
|       `-- utils/                         # Formatting helpers.
|-- logs/                                  # Local runtime logs, ignored by git.
|-- .env                                   # Local secrets file, ignored by git. Do not commit values.
|-- .env.example                           # Placeholder environment variables.
|-- .gitignore                             # Ignores secrets, caches, virtualenvs, logs, local runtime files.
|-- AGENTS.md                              # Project-specific agent instructions.
|-- antigravity-usage.md                   # Antigravity workflow notes.
|-- codex_prompt.md                        # Internal/local prompt notes, ignored by git.
|-- documentation.txt                      # Extended local documentation/source notes.
|-- future_production_input_layer.md       # Notes for future production input layer.
|-- main.py                                # FastAPI app, API routes, dashboard/static/PWA serving.
|-- PROJECT_SUMMARY.md                     # Project-level summary.
|-- prompt.txt                             # Internal/local prompt notes, ignored by git.
|-- README.md                              # Main setup, feature, safety, API, and demo documentation.
|-- REPO_STRUCTURE.md                      # This repository tree and summary document.
|-- requirements.txt                       # Python dependencies.
|-- scrach_prompt.txt                      # Internal/local prompt notes, ignored by git.
|-- simulate_inputs.py                     # Legacy scenario simulation CLI.
|-- Task_From_google.txt                   # Local challenge/task notes, ignored by git.
`-- test_gemini_connection.py              # Gemini API connectivity smoke test.
```

## Directory Responsibilities

| Path | Responsibility |
|---|---|
| `main.py` | FastAPI entry point, public routes, dashboard serving, PWA routes, artifact endpoints, safe map config endpoint. |
| `backend/` | Core CIRO domain logic, schemas, deterministic pipelines, and agent modules. |
| `backend/agents/` | Deterministic crisis agents for signal watching, detection, analysis, planning, simulation, and impact reporting. |
| `backend/services/` | Persistence helpers, scenario stores, confidence math, mock tools, and Google Maps Platform wrappers. |
| `adk_ciro/` | Google ADK root agent and tool wrappers that call the same backend functions. |
| `dashboard/` | Browser command center for scenario control, metrics, timeline, decision trace, map, route/weather panels, artifacts, and PWA support. |
| `mobile/` | Expo React Native Field Officer app using existing CIRO APIs with mock fallback adapters. |
| `artifacts/` | Latest generated judge evidence files. These are intentionally visible for demo review. |
| `.adk/`, `.tools/`, `logs/`, `.venv/`, `__pycache__/` | Local runtime/tool/cache state. Not core source. |

## Important Runtime Entry Points

| Command | Purpose |
|---|---|
| `python -m uvicorn main:app --reload --host 127.0.0.1 --port 8080` | Run the FastAPI dashboard/API server. |
| `python adk_ciro\run_adk_demo.py` | Run the ADK/Gemini terminal demo path. |
| `adk web` | Open the Google ADK web interface from the repo root. |
| `python simulate_inputs.py` | Run deterministic legacy scenario simulation. |
| `python test_gemini_connection.py` | Verify `GOOGLE_API_KEY` and Gemini connectivity. |
| `python backend\agent_pipeline.py scenario_1` | Run the legacy one-pass backend pipeline directly. |

## Backend Route Summary

| Method | Route | Module/Function | Summary |
|---|---|---|---|
| `GET` | `/health` | `main.py::health` | Basic app health. |
| `GET` | `/api/config` | `main.py::api_config` | Returns dashboard config, Maps status, and restricted public browser key when configured. |
| `GET` | `/api/scenarios` | `scenario_store.py` | Lists legacy one-pass scenarios. |
| `GET` | `/api/scenarios/{scenario_id}` | `scenario_store.py` | Returns one legacy scenario. |
| `POST` | `/api/pipeline/run` | `agent_pipeline.py` | Runs legacy deterministic pipeline. |
| `GET` | `/api/iterative/scenarios` | `iterative_scenario_store.py` | Lists three-step iterative scenarios. |
| `GET` | `/api/iterative/scenarios/{scenario_id}` | `iterative_scenario_store.py` | Returns one iterative scenario definition. |
| `POST` | `/api/iterative/run` | `iterative_pipeline.py` | Runs three-iteration CIRO Commander flow and writes artifacts. |
| `GET` | `/api/weather` | `google_maps.py` | Returns Google Weather API or mock fallback weather update. |
| `GET` | `/api/route` | `google_maps.py` | Returns Google Routes API or mock fallback original/alternate route. |
| `POST` | `/api/mini-assistant/extract` | `mini_assistant.py` | Extracts crisis signal from user-approved pasted content. |
| `POST` | `/api/iterative/run-custom` | `mini_assistant.py` + `iterative_pipeline.py` | Runs approved custom crisis input through existing iterative pipeline. |
| `GET` | `/api/artifacts` | `artifacts.py` | Lists artifact metadata. |
| `GET` | `/api/artifacts/{filename}` | `artifacts.py` | Reads one JSON/Markdown artifact. |
| `GET` | `/` | `dashboard/index.html` | Serves dashboard. |
| `GET` | `/dashboard/*` | FastAPI `StaticFiles` | Serves dashboard static assets. |
| `GET` | `/manifest.json` | `dashboard/manifest.json` | Serves PWA manifest. |
| `GET` | `/sw.js` | `dashboard/sw.js` | Serves service worker with no-cache header. |
| `GET` | `/favicon.ico` | `main.py::favicon` | Empty favicon response. |

## Scenario And Agent Flow

Legacy one-pass flow:

```text
ScenarioInput
-> Signal Watcher
-> Crisis Detector
-> Situation Analyst
-> Response Planner
-> Execution Simulator
-> Impact Reporter
-> PipelineResult
```

Iterative commander flow:

```text
IterativeScenarioDefinition
-> HumanApprovalRecord
-> Iteration 1
-> Iteration 2
-> Iteration 3
-> RiskScoreRecord
-> Google map/weather/route payload generation
-> rescue_action_plan.md
-> final_crisis_report.md
-> IterativePipelineResult
```

Each iterative pass runs:

```text
CIRO Commander Agent
-> Weather Risk Agent
-> Traffic Analysis Agent
-> Social/Public Signal Agent
-> Verification Agent
-> Crisis Reasoning Agent
-> Rescue Planning Agent
-> Action Execution Agent
-> Evaluation/Replanning Agent
-> Legacy pipeline consistency check
-> Iteration trace artifact
```

## Google Maps Platform Layer

`backend/services/google_maps.py` is additive to the existing architecture. It does not replace crisis scoring or response planning.

Functions:

- `geocode_location(location: str)`: resolves scenario place names to `lat/lng/formatted_address`.
- `get_google_weather_signal(location: str, scenario=None)`: normalizes Weather API current conditions into CIRO weather intelligence.
- `get_google_route_data(origin, destination, blocked_route=None)`: normalizes Routes API route/alternate route data into dashboard-friendly geometry and ETA/distance.
- `build_scenario_map_payload(...)`: creates the latest map payload for dashboard rendering and artifacts.

Fallback behavior:

- If `GOOGLE_MAPS_API_KEY` is missing or an API call fails, CIRO uses mock coordinates/weather/routes.
- Every Google/fallback attempt is summarized in `artifacts/google_api_trace.json`.
- API keys and full request URLs are not written to artifacts.

Dashboard behavior:

- `Before` mode shows crisis marker, weather marker, and red blocked route.
- `After` mode shows rescue marker and green alternate route.
- Weather and Route Intelligence panels show whether data came from Google APIs or mock fallback.

## Artifact Summary

| Artifact | Producer | Summary |
|---|---|---|
| `scenario_input.json` | `iterative_pipeline.py` | Latest iterative scenario used for the run. |
| `human_approval_record.json` | `iterative_pipeline.py` | Simulated approval scope and privacy constraints. |
| `iteration_1_decision_trace.json` | `iterative_pipeline.py` | First pass trace and agent outputs. |
| `iteration_2_replan_trace.json` | `iterative_pipeline.py` | Second pass trace and replan state. |
| `iteration_3_final_trace.json` | `iterative_pipeline.py` | Final pass trace and outcome. |
| `risk_score.json` | `iterative_pipeline.py` | Per-iteration and final risk/confidence summary. |
| `agent_tool_calls.json` | `iterative_pipeline.py` | Judge-readable agent/tool-call trace. |
| `rescue_action_plan.md` | `iterative_pipeline.py` | Human-readable simulated response plan. |
| `final_crisis_report.md` | `iterative_pipeline.py` | Final report for the latest run. |
| `google_api_trace.json` | `google_maps.py` | Sanitized Google API/fallback trace. |
| `map_route_trace.json` | `google_maps.py` via pipeline | Map markers, red/green route geometry, route intelligence. |
| `weather_signal_trace.json` | `iterative_pipeline.py` | Weather panel data extracted from map payload. |
| `google_maps_integration_plan.md` | Manual analysis artifact | Phase 1 analysis and Phase 2 implementation plan. |
| `codebase_analysis.md` | Prior analysis artifact | Repository analysis from earlier development. |

## Environment And Security Summary

Tracked placeholder variables:

```env
GOOGLE_API_KEY=your_gemini_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
CIRO_ENV=development
```

Security rules reflected in the repo:

- `.env` is ignored by git.
- `.env.example` contains only placeholders.
- Browser Maps JavaScript requires a public browser key via `/api/config`; README documents Google Cloud API and HTTP referrer restrictions.
- Real emergency dispatch, public alerts, social scraping, and authority integrations are not implemented.
- Google Maps Platform calls are contextual only and fall back to mocks.

## Data Ownership And State

- Scenario catalogs are in-memory Python dictionaries in `scenario_store.py` and `iterative_scenario_store.py`.
- Main pipeline state is Pydantic model data passed between deterministic agents.
- Dashboard state is held in browser JavaScript variables such as `currentResult`, `selectedIteration`, `currentMapTrace`, and `mapMode`.
- Durable latest-run evidence is stored in `artifacts/`.
- Local runtime state in `.adk/`, `logs/`, `.venv/`, `.tools/`, and `__pycache__/` should not be treated as source.

## Practical Modification Guidance

Safe areas for incremental feature work:

- Add backend service wrappers under `backend/services/`.
- Extend iterative artifacts from `backend/iterative_pipeline.py`.
- Add dashboard panels in `dashboard/index.html` without moving orchestration logic into the frontend.
- Document setup and safety changes in `README.md` and `REPO_STRUCTURE.md`.

Areas to modify carefully:

- `backend/schemas.py` and `backend/iterative_schemas.py`, because schema changes can affect multiple agents and API responses.
- `adk_ciro/agent.py` and `adk_ciro/tools.py`, because they define the ADK-facing tool surface.
- Generated artifacts, because they are intentionally latest-run evidence and may be overwritten by scenario runs.

Avoid:

- Hardcoding real API keys.
- Removing fallback mocks.
- Replacing the deterministic agent loop with frontend-only logic.
- Claiming real emergency execution or dispatch.
