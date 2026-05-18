# PROJECT SUMMARY

## Project Purpose

CIRO, Crisis Intelligence & Response Orchestrator, is a local crisis-response demo for fragmented emergency signals. It combines simulated social/public reports, weather, and traffic data, then runs deterministic multi-agent reasoning to decide whether a crisis should escalate and what simulated response actions should be planned.

The project is explicitly simulation-only. It does not contact real emergency services, public alert systems, maps, or authority APIs.

## System Overview

The application has three main surfaces:

- FastAPI backend in `main.py`
- Static dashboard in `dashboard/index.html`
- Google ADK integration in `adk_ciro/`

The backend contains two execution paths:

- Legacy one-pass pipeline: Signal Watcher -> Crisis Detector -> Situation Analyst -> Response Planner -> Execution Simulator -> Impact Reporter.
- Iterative commander pipeline: three iterations of Observe -> Verify -> Reason -> Plan -> Act -> Evaluate -> Re-plan.

## Architecture Overview

- `backend/schemas.py` and `backend/iterative_schemas.py` define strict Pydantic data contracts.
- `backend/agents/` contains deterministic agent functions.
- `backend/services/` contains scenario stores, confidence scoring, mock external tools, and artifact storage.
- `backend/iterative_pipeline.py` coordinates iterative state and artifact generation.
- `adk_ciro/tools.py` exposes backend functions as Google ADK tools.
- `adk_ciro/agent.py` defines the `ciro_orchestrator` root agent with Gemini model configuration and fallback behavior.
- `dashboard/index.html` calls FastAPI endpoints and renders scenario state, traces, actions, artifacts, and reports.

## Execution Flow

1. Run the app with `uvicorn main:app --port 8000`.
2. Open `http://localhost:8000`.
3. Dashboard loads scenarios from `GET /api/iterative/scenarios`.
4. User runs a scenario with `POST /api/iterative/run`.
5. FastAPI calls `run_iterative_pipeline_by_id()`.
6. The commander loop executes three scenario steps.
7. Artifacts are written to `artifacts/`.
8. The API response updates dashboard metrics, timeline, traces, action plan, simulated actions, artifact viewer, and final report.

ADK terminal execution starts with `python adk_ciro\run_adk_demo.py`.

## Important Modules

- `main.py`: API and dashboard entry point.
- `backend/agent_pipeline.py`: legacy one-pass pipeline.
- `backend/iterative_pipeline.py`: iterative commander loop and artifact generation.
- `backend/agents/iterative_agents.py`: iterative agent wrappers.
- `backend/services/artifacts.py`: artifact save/read/list helpers with path validation.
- `backend/services/confidence.py`: deterministic confidence and escalation logic.
- `backend/services/scenario_store.py`: five legacy scenarios.
- `backend/services/iterative_scenario_store.py`: three iterative scenarios.
- `adk_ciro/agent.py`: ADK root agent.
- `adk_ciro/tools.py`: ADK tool wrappers.
- `dashboard/index.html`: frontend UI.

## Current Capabilities

- Lists legacy and iterative scenarios.
- Runs one-pass deterministic crisis pipeline.
- Runs three-iteration iterative crisis pipeline.
- Produces confidence, risk, severity, escalation, response plan, simulation, and impact summaries.
- Writes JSON and Markdown artifacts.
- Displays generated artifacts through the dashboard and API.
- Supports ADK-style tool orchestration and optional Gemini narration.
- Provides a local Gemini connection test.

## Current Limitations

- No production database or durable multi-run history.
- Fixed artifact filenames are overwritten by later runs.
- No authentication or authorization.
- Open CORS configuration.
- No formal pytest suite or CI configuration detected.
- Scenario data is hardcoded in Python.
- Real external integrations are intentionally absent.

## Future Extension Points

- Add run-scoped artifact storage.
- Add test coverage for scoring, escalation, artifact safety, and API routes.
- Add external scenario fixtures validated by Pydantic.
- Add persistence for historical runs and audit trails.
- Add production-safe CORS and access control.
- Add new ADK tools that reuse existing backend services.
- Add dashboard panels for richer run comparison without moving domain logic into the frontend.
