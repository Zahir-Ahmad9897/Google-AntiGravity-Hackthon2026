# Existing System Overview

CIRO is a Python/FastAPI crisis-response demo that runs simulated emergency scenarios through deterministic agent modules and an iterative commander flow. It ingests static simulated social, weather, and traffic inputs; verifies and scores crisis signals; plans simulated response actions; evaluates impact; and writes review artifacts under `artifacts/`.

Architecture summary:
- `main.py` is the FastAPI entry point and static dashboard server.
- `backend/agent_pipeline.py` preserves the legacy six-agent one-pass pipeline.
- `backend/iterative_pipeline.py` implements the three-iteration commander loop.
- `backend/agents/` contains deterministic agent functions.
- `backend/services/` provides scenario catalogs, confidence scoring, mock tools, and artifact I/O.
- `adk_ciro/` exposes the deterministic backend as Google ADK tools and defines the `ciro_orchestrator` root agent.
- `dashboard/index.html` is a vanilla HTML/CSS/JS dashboard that calls FastAPI endpoints.

Data flow summary:
1. Dashboard or API client selects a scenario.
2. `POST /api/iterative/run` calls `run_iterative_pipeline_by_id()`.
3. The pipeline loads a three-step scenario from `iterative_scenario_store.py`.
4. Each iteration runs Commander, Weather Risk, Traffic Analysis, Social/Public Signal, Verification, Crisis Reasoning, Rescue Planning, Action Execution, and Evaluation/Replanning agents.
5. Legacy deterministic agents are reused for signal extraction, clustering, situation analysis, planning, simulation, and reporting.
6. Artifacts are written through `backend/services/artifacts.py`.
7. The API returns a serialized `IterativePipelineResult`; the dashboard renders final metrics, traces, action plans, simulated actions, artifacts, and the final report.

# Existing Components

Frontend modules:
- `dashboard/index.html`: static command center UI, scenario selector, iterative run trigger, permission-based mini assistant, timeline, trace viewer, action plan panel, artifact viewer, and final report panel.
- Frontend state is local JavaScript variables: `currentResult` and `selectedIteration`.
- API usage: `fetch('/api/iterative/scenarios')`, `fetch('/api/iterative/run')`, `fetch('/api/artifacts')`, and `fetch('/api/artifacts/{filename}')`.

Backend modules:
- `main.py`: FastAPI app, CORS configuration, request model, dashboard route, scenario routes, pipeline routes, and artifact routes.
- `backend/schemas.py`: strict Pydantic v2 models for legacy scenarios, signals, confidence, crisis clusters, plans, simulated execution, reports, logs, and pipeline results.
- `backend/iterative_schemas.py`: Pydantic models for iterative scenarios, traces, agent step outputs, human approval, risk records, tool call records, and iterative results.
- `backend/agent_pipeline.py`: one-pass deterministic flow.
- `backend/iterative_pipeline.py`: three-iteration orchestration, state carryover, risk scoring, artifact generation, and final result assembly.

Services:
- `backend/services/scenario_store.py`: five legacy static scenarios.
- `backend/services/iterative_scenario_store.py`: three iterative scenarios with three steps each.
- `backend/services/confidence.py`: deterministic confidence formula, bands, and escalation thresholds.
- `backend/services/mock_tools.py`: mock weather, traffic, public report, verification, risk score, rescue plan, and action simulation helpers.
- `backend/services/artifacts.py`: safe artifact path resolution, JSON/Markdown serialization, save/read/list helpers.

Agents:
- Legacy agents: `signal_watcher.py`, `crisis_detector.py`, `situation_analyst.py`, `response_planner.py`, `execution_simulator.py`, `impact_reporter.py`.
- Iterative wrapper agents: `iterative_agents.py` implements CIRO Commander, Weather Risk, Traffic Analysis, Social/Public Signal, Verification, Crisis Reasoning, Rescue Planning, Action Execution, Evaluation/Replanning, and legacy consistency check wrappers.

APIs:
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

Utilities and entry points:
- `simulate_inputs.py`: regression-style runner for five legacy scenarios.
- `test_gemini_connection.py`: Gemini API smoke test using `.env`.
- `adk_ciro/run_adk_demo.py`: terminal ADK-style demo for all iterative scenarios with optional Gemini narration.
- `adk_ciro/agent.py`: ADK root agent setup with fallback object if ADK import fails.
- `adk_ciro/tools.py`: ADK tool wrappers around deterministic backend functions.

Database usage:
- No application database layer is used.
- ADK runtime `session.db` files exist under `adk_ciro/.adk/` and `dashboard/.adk/`; they are local runtime state, not CIRO domain storage.

Environment configuration:
- `.env.example` documents `GOOGLE_API_KEY`, `GROQ_API_KEY`, and `HUGGINGFACEHUB_API_TOKEN`.
- `.env` exists locally; values were not documented.
- `CIRO_ADK_MODEL` optionally overrides the Gemini model.
- `CIRO_SKIP_NARRATION` skips optional Gemini narration in `run_adk_demo.py`.
- `GOOGLE_GENAI_USE_VERTEXAI` defaults to `False` in `adk_ciro/agent.py` unless already configured.

Artifact/logging system:
- Iterative runs write latest-run files under `artifacts/`: scenario input, human approval, three iteration traces, risk score, tool calls, rescue action plan, and final crisis report.
- Legacy pipeline logs are in-memory `AgentLog` objects inside `PipelineResult`.
- FastAPI logs exceptions with Python `logging.exception()`.

# Current Strengths

- Clear separation between API, deterministic backend agents, ADK wrappers, services, schemas, and dashboard.
- Strict Pydantic schemas reduce malformed outputs and make API responses predictable.
- Deterministic scoring and planning make demo behavior repeatable.
- Iterative orchestration reuses the stable legacy pipeline instead of duplicating all logic.
- Artifact writer validates paths to prevent writes outside `artifacts/`.
- Human approval and simulation-only constraints are represented explicitly.
- Dashboard is dependency-free and directly exercises the iterative API.
- ADK integration has a fallback path, so deterministic demos can still run without live ADK.

# Weaknesses / Missing Parts

- No persistent application database, queue, or multi-user session model.
- Artifacts use fixed filenames, so each iterative run overwrites previous latest-run outputs.
- No automated test suite framework is configured; validation is mostly script-based.
- No authentication, authorization, or rate limiting on FastAPI endpoints.
- Dashboard state is client-local only and not recoverable after refresh except by re-reading artifacts.
- CORS is open to all origins.
- Static scenarios are hardcoded in Python services; there is no external scenario loader or admin workflow.
- ADK session database files are present in subdirectories despite `.gitignore` rules for runtime state.
- Existing `.env` is present locally; it should remain untracked and never be committed.

# Recommended Improvements

- Add focused tests for confidence thresholds, scenario stores, iterative pipeline output shape, artifact path validation, and API routes.
- Add timestamped or run-id scoped artifact directories while preserving current latest-run filenames for demo compatibility.
- Add a small persistence abstraction if multiple users, historical runs, or audit trails become required.
- Restrict CORS for production deployment.
- Add a scenario fixture format, such as JSON/YAML, if non-developers need to author scenarios.
- Keep legacy one-pass endpoints for regression checks while extending only additive APIs.
- Add startup checks for required environment variables when ADK/Gemini features are invoked.
- Keep the dashboard thin; avoid moving crisis logic into JavaScript.

# Risk Areas

- Rewriting deterministic agents would risk changing validated demo behavior and expected scores.
- Changing schemas destructively would break FastAPI responses, dashboard rendering, and ADK tool outputs.
- Moving artifact paths without compatibility handling would break dashboard artifact loading and README commands.
- Adding real emergency, map, social media, or authority integrations would change the safety model; current actions are simulation-only.
- Hardcoded scenario stores are simple and stable, but changes can alter expected escalation behavior.
- Open CORS is acceptable for local demo use but risky for deployed environments.
- ADK imports and Gemini calls depend on local package installation, credentials, model availability, and quota.

# Safe Customization Plan

## What Should Be Preserved

- `backend/agent_pipeline.py` and the six legacy agents as regression baseline.
- Existing confidence formula and escalation thresholds unless tests and docs are updated together.
- Simulation-only action execution and explicit human approval record.
- `artifacts/` latest-run artifact names used by the dashboard.
- ADK tool-wrapper pattern where Gemini orchestrates but deterministic Python computes safety-critical outputs.

## What Should Be Modified

- Add tests around existing behavior before larger refactors.
- Add run IDs or timestamped artifact folders additively.
- Add deployment hardening in `main.py`, especially CORS and environment handling.
- Add external scenario loading only behind existing Pydantic validation.

## What Can Be Extended Safely

- New scenario definitions in `iterative_scenario_store.py`.
- New API endpoints that do not change existing response shapes.
- Additional dashboard panels consuming existing result fields.
- Additional ADK tools that call existing backend services.
- New artifact formats written through `save_artifact()`.

## What Should NOT Be Rewritten

- The core deterministic agent modules without first adding regression tests.
- Pydantic model field names used by the dashboard and ADK tools.
- The safety boundary that prevents real dispatches, public alerts, map writes, or authority calls.
- The path validation in `backend/services/artifacts.py`.

## Best Refactor Strategy

Refactor additively. First add tests that lock current scenario outputs, then introduce narrow service boundaries for persistence, scenario loading, and configuration. Keep orchestration in `backend/iterative_pipeline.py`, keep domain decisions in backend agents, and keep the dashboard as a renderer of API state.
