# REPO STRUCTURE

Tree based on inspected repository contents. Generated cache and virtual environment internals are summarized instead of expanded.

```text
D:\Antigravity_Hackthon
|-- .adk/
|   `-- artifacts/
|-- .env
|-- .env.example
|-- .gitignore
|-- .venv/
|-- AGENTS.md
|-- PROJECT_SUMMARY.md
|-- README.md
|-- REPO_STRUCTURE.md
|-- antigravity-usage.md
|-- archive/
|   `-- ARCHIVED_FILES.md
|-- artifacts/
|   |-- agent_tool_calls.json
|   |-- codebase_analysis.md
|   |-- final_crisis_report.md
|   |-- human_approval_record.json
|   |-- iteration_1_decision_trace.json
|   |-- iteration_2_replan_trace.json
|   |-- iteration_3_final_trace.json
|   |-- rescue_action_plan.md
|   |-- risk_score.json
|   `-- scenario_input.json
|-- backend/
|   |-- __init__.py
|   |-- agent_pipeline.py
|   |-- iterative_pipeline.py
|   |-- iterative_schemas.py
|   |-- schemas.py
|   |-- agents/
|   |   |-- __init__.py
|   |   |-- crisis_detector.py
|   |   |-- execution_simulator.py
|   |   |-- impact_reporter.py
|   |   |-- iterative_agents.py
|   |   |-- response_planner.py
|   |   |-- signal_watcher.py
|   |   `-- situation_analyst.py
|   `-- services/
|       |-- __init__.py
|       |-- artifacts.py
|       |-- confidence.py
|       |-- iterative_scenario_store.py
|       |-- mock_tools.py
|       `-- scenario_store.py
|-- dashboard/
|   |-- .adk/
|   |   `-- session.db
|   `-- index.html
|-- adk_ciro/
|   |-- .adk/
|   |   `-- session.db
|   |-- __init__.py
|   |-- agent.py
|   |-- run_adk_demo.py
|   `-- tools.py
|-- documentation.txt
|-- future_production_input_layer.md
|-- main.py
|-- requirements.txt
|-- simulate_inputs.py
|-- test_gemini_connection.py
|-- Task_From_google.txt
|-- codex_prompt.md
|-- prompt.txt
|-- scrach_prompt.txt
`-- __pycache__/
```

## Directory Responsibilities

- `backend/`: core application logic and data models.
- `backend/agents/`: deterministic agent implementations and iterative agent wrappers.
- `backend/services/`: static scenario data, scoring, mock external tools, artifact persistence.
- `adk_ciro/`: Google ADK root agent, tool wrappers, and terminal demo runner.
- `dashboard/`: static browser UI served by FastAPI.
- `artifacts/`: latest generated JSON and Markdown outputs from iterative runs.
- `archive/`: notes about moved non-critical runtime files.
- `.adk/`, `adk_ciro/.adk/`, `dashboard/.adk/`: local ADK runtime state.
- `.venv/`, `__pycache__/`: local Python environment/cache.

## Important Files

- `main.py`: FastAPI app and dashboard server.
- `requirements.txt`: Python dependencies.
- `.env.example`: documented environment variables.
- `.gitignore`: ignores secrets, virtualenvs, caches, logs, ADK runtime state, and internal prompt files.
- `README.md`: setup, run commands, API routes, scenario overview.
- `AGENTS.md`: project-specific agent development rules.
- `artifacts/codebase_analysis.md`: repository analysis document.
- `PROJECT_SUMMARY.md`: concise project documentation.
- `REPO_STRUCTURE.md`: repository structure documentation.

## Execution Entry Points

- Web app: `uvicorn main:app --port 8000`
- Dashboard URL: `http://localhost:8000`
- ADK terminal demo: `python adk_ciro\run_adk_demo.py`
- Legacy verification runner: `python simulate_inputs.py`
- Gemini smoke test: `python test_gemini_connection.py`
- Direct legacy pipeline: `python backend\agent_pipeline.py scenario_1`
- ADK web: `adk web`

## Backend API Relationships

- `GET /health` returns app health.
- `GET /api/scenarios` reads `backend/services/scenario_store.py`.
- `POST /api/pipeline/run` calls `backend/agent_pipeline.py`.
- `GET /api/iterative/scenarios` reads `backend/services/iterative_scenario_store.py`.
- `POST /api/iterative/run` calls `backend/iterative_pipeline.py`.
- `GET /api/artifacts` and `GET /api/artifacts/{filename}` call `backend/services/artifacts.py`.
- `GET /` serves `dashboard/index.html`.

## Orchestration Flow

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
-> rescue_action_plan.md
-> final_crisis_report.md
-> IterativePipelineResult
```

Each iteration executes:

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
-> iteration trace artifact
```

## Request Lifecycle

Dashboard iterative run:

1. Browser loads `/`.
2. JavaScript requests `/api/iterative/scenarios`.
3. User selects a scenario and clicks run.
4. JavaScript posts `{ "scenario_id": "..." }` to `/api/iterative/run`.
5. FastAPI validates the request with `PipelineRunRequest`.
6. `run_iterative_pipeline_by_id()` loads scenario steps and creates approval state.
7. Agent wrappers run deterministic backend modules and mock tool helpers.
8. `save_artifact()` writes JSON/Markdown outputs under `artifacts/`.
9. FastAPI returns `IterativePipelineResult`.
10. Dashboard updates metrics, timeline, traces, action plan, simulated actions, and report.
11. Dashboard calls artifact endpoints to list/read generated files.

## State Updates

- Scenario catalogs are module-level in-memory dictionaries.
- Legacy pipeline state is carried in Pydantic return objects.
- Iterative state is represented by `previous_trace`, `traces`, `tool_calls`, latest planner/analyst outputs, and final risk/report models.
- Dashboard state is held in `currentResult` and `selectedIteration`.
- Artifacts provide latest-run durable state.

## API/Service Relationships

- FastAPI delegates all domain behavior to backend modules.
- ADK tools delegate to the same deterministic backend functions.
- Mock weather, traffic, public reports, verification, and risk scoring live in `backend/services/mock_tools.py`.
- Artifact reads and writes flow through `backend/services/artifacts.py`.
- No frontend domain scoring or escalation logic was detected.

## Artifact And Logging Flow

- `backend/iterative_pipeline.py` writes:
  - `scenario_input.json`
  - `human_approval_record.json`
  - `iteration_1_decision_trace.json`
  - `iteration_2_replan_trace.json`
  - `iteration_3_final_trace.json`
  - `risk_score.json`
  - `agent_tool_calls.json`
  - `rescue_action_plan.md`
  - `final_crisis_report.md`
- `artifacts.py` serializes Pydantic models and plain strings.
- `list_artifacts()` exposes artifact metadata to the API.
- Legacy logs are returned inside `PipelineResult.logs`.
- FastAPI exception paths use Python logging.
