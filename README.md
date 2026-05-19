# CIRO - Crisis Intelligence & Response Orchestrator

**Tagline:** Iterative multi-agent crisis intelligence for fragmented emergency signals.  
**Hackathon:** Google Antigravity / AISeekho2026 Challenge 3 - Crisis Intelligence & Response Orchestrator  
**Team:** Zahir Ahmad

CIRO is a hackathon prototype. It is not a production emergency response system.

---

## Executive Summary

CIRO helps convert fragmented emergency signals into a structured crisis response workflow.  
It combines simulated weather, traffic, public emergency reports, and user-approved contextual input.  
An iterative multi-agent loop observes signals, verifies evidence, reasons about crisis level, plans actions, simulates execution, evaluates impact, and re-plans.  
The system emphasizes explainable decisions, confidence scoring, artifact generation, and dashboard visibility.  
All actions are simulation-only and no real authority, map, social media, or emergency service integration is contacted.  
The current demo is optimized for judges to inspect orchestration, reasoning traces, plans, simulated outcomes, and generated evidence files.

---

## Problem Statement

Emergency response signals are often fragmented across weather alerts, traffic disruptions, public reports, and operator context. Response teams may see these signals in separate tools, making it difficult to decide whether a situation is isolated noise, a watchlist condition, or an active crisis.

CIRO addresses this by converting multi-source crisis signals into structured events, confidence scores, coordinated response plans, simulated execution results, and reviewable artifacts. The system is designed to show how agent orchestration can support earlier detection, better explanation, and safer crisis planning.

---

## Solution Overview

CIRO implements:

- Multi-source signal ingestion from simulated weather, traffic, and public reports.
- Event detection through deterministic signal extraction and clustering.
- Situation analysis with confidence, severity, affected roads, and risks.
- Iterative orchestration through a three-pass Observe -> Verify -> Reason -> Plan -> Act -> Evaluate -> Re-plan loop.
- Coordinated action planning for dispatch, rerouting, public warnings, and shelter preparation.
- Simulation-only execution with before/after state changes.
- Artifact-first logs and reports for judging, debugging, and explainability.
- A FastAPI dashboard with scenario selection, agent timeline, decision trace, action plan, artifacts, final report, and PWA support.

---

## Key Features

- **Google ADK orchestration:** `adk_ciro/agent.py` defines a Google ADK root agent with CIRO tools.
- **Gemini reasoning:** ADK uses `gemini-2.0-flash` by default through `CIRO_ADK_MODEL`; `run_adk_demo.py` can also generate optional Gemini narration.
- **Iterative loop:** Each main demo scenario runs three iterations: Observe -> Verify -> Reason -> Plan -> Act -> Evaluate -> Re-plan.
- **CIRO Commander Agent:** Coordinates scenario lifecycle, shared state, and iteration control.
- **Weather Risk Agent:** Analyzes rainfall, alert activity, flood/storm risk, severity, and confidence.
- **Traffic Analysis Agent:** Detects road blockage, congestion, ambulance delay risk, and alternate route suggestions.
- **Social/Public Signal Agent:** Reads only authorized demo public context and extracts emergency-relevant reports.
- **Verification Agent:** Deduplicates/noise-filters signals and calculates confidence.
- **Crisis Reasoning Agent:** Determines crisis level and produces concise evidence summaries.
- **Rescue Planning Agent:** Produces simulated dispatch, reroute, shelter, and public warning plans.
- **Action Execution Agent:** Simulates route updates, alerts, tickets, dashboard updates, and state changes.
- **Evaluation/Replanning Agent:** Evaluates outcome, detects trend changes, and sets the next iteration step.
- **Safety:** No real emergency services, public alerts, social scraping, or live map APIs are called.
- **Human approval:** Prototype / simulated approval record is generated in `human_approval_record.json`.
- **Artifacts:** Decision traces, risk scores, tool calls, action plans, and final reports are written under `artifacts/`.
- **Dashboard:** Vanilla HTML/CSS/JS command center served by FastAPI.
- **Mobile PWA:** Implemented with `dashboard/manifest.json`, `dashboard/sw.js`, icons, and install prompt support.
- **Custom contextual input:** Prototype Mini Assistant supports permission-based pasted text analysis in the dashboard; it does not yet create a dynamic scenario or run the full pipeline.
- **Map visualization:** Planned. Current code simulates route updates in artifacts and dashboard text, but no Leaflet map is implemented.

---

## Official Challenge Requirement Mapping

| Challenge Requirement | CIRO Implementation |
|---|---|
| Multi-source input | Simulated weather, traffic, public reports, and permission-based dashboard text input. |
| Event detection | `Signal Watcher`, `Crisis Detector`, and iterative signal agents convert inputs into structured crisis signals. |
| Reasoning and confidence | Confidence math, severity scoring, crisis level, concise reasoning summaries, and optional Gemini narration. |
| Action planning | `Rescue Planning Agent` and `Response Planner` create simulated dispatch, reroute, alert, and shelter plans. |
| Action simulation | `Action Execution Agent` and `Execution Simulator` generate simulated route updates, alerts, tickets, and state changes. |
| Outcome visualization | Dashboard metrics, timeline, traces, action plan, simulated actions, artifacts, and final report. Map view is planned. |
| Agentic workflow | Google ADK root agent plus CIRO Commander iterative loop and deterministic backend agents. |
| Mobile app | Implemented as installable PWA. Native Android app is not implemented. |
| Agent trace/logs | `iteration_*_trace.json`, `agent_tool_calls.json`, FastAPI responses, and dashboard trace panels. Live `/api/trace` is planned. |
| README/docs | This README plus `artifacts/codebase_analysis.md`, `PROJECT_SUMMARY.md`, `REPO_STRUCTURE.md`, and `antigravity-usage.md`. |

---

## Architecture Overview

```text
User-approved public reports + simulated weather + simulated traffic
        |
        v
Signal Processing
        |
        v
CIRO Commander Agent
        |
        v
Weather / Traffic / Social / Verification / Reasoning / Planning / Execution / Evaluation Agents
        |
        v
Simulated Actions + Artifacts + Dashboard
```

Runtime structure:

```text
FastAPI main.py
  |-- dashboard/index.html
  |-- backend/iterative_pipeline.py
  |-- backend/agents/iterative_agents.py
  |-- backend/agent_pipeline.py
  |-- backend/services/*
  |-- artifacts/*

Google ADK path
  |-- adk_ciro/agent.py
  |-- adk_ciro/tools.py
  |-- adk_ciro/run_adk_demo.py
```

---

## Agent Workflow

**Observe:** Collect simulated weather, traffic, and permission-approved public report signals for the current iteration.

**Verify:** Deduplicate signals, remove noise, calculate source diversity, and compute confidence inputs.

**Reason:** Determine crisis type, location, affected roads, severity, confidence, and escalation level.

**Plan:** Create a constrained rescue plan with dispatch, reroute, alert, and shelter actions when escalation is justified.

**Act:** Simulate action execution only. No external authority, map, social, or emergency API is called.

**Evaluate:** Compare current risk, crisis level, simulated state changes, impact, and remaining risk.

**Re-plan:** Continue to the next iteration with updated signals, then finalize the crisis report after iteration 3.

---

## Agent Responsibilities

| Agent | Responsibility | Output |
|---|---|---|
| CIRO Commander Agent | Root iterative orchestrator for scenario lifecycle, shared state, and loop control. | Iteration state, transition, shared state summary. |
| Weather Risk Agent | Analyze rainfall, alert status, alert level, and flood/storm risk. | Weather severity, confidence, weather signal. |
| Traffic Analysis Agent | Detect blocked or congested roads and ambulance delay risk. | Blocked roads, alternate routes, delay risk. |
| Social/Public Signal Agent | Read only authorized demo public context and extract emergency-relevant reports. | Emergency report list, permission status, ignored count. |
| Verification Agent | Run signal watcher and crisis detector, deduplicate/noise-filter signals, compute confidence. | Verified count, confidence, risk score, detector output. |
| Crisis Reasoning Agent | Determine crisis level and connect multi-source evidence. | Crisis level, concise reasoning, situation analysis. |
| Rescue Planning Agent | Generate simulated rescue, reroute, warning, and shelter plans. | Action plan and planning rationale. |
| Action Execution Agent | Run simulation-only response actions. | Route updates, alerts, tickets, state changes. |
| Evaluation/Replanning Agent | Evaluate impact and decide escalation/de-escalation/re-plan step. | Evaluation result and next step. |
| Signal Watcher | Legacy deterministic agent that extracts structured `SignalEvent` objects. | Social, weather, and traffic signals. |
| Crisis Detector | Legacy deterministic agent that clusters signals and calculates escalation. | Crisis cluster, confidence band, escalation. |
| Situation Analyst | Legacy deterministic agent that analyzes severity, roads, population density, and risks. | Situation analysis and reasoning chain. |
| Response Planner | Legacy deterministic agent that chooses depot, shelter, routes, and response actions. | Response plan. |
| Execution Simulator | Legacy deterministic agent that simulates alerts, route updates, tickets, and state changes. | Simulated execution result. |
| Impact Reporter | Legacy deterministic agent that compares pre-action and simulated post-action state. | Impact report and remaining risk. |

---

## Repository Structure

Selected actual tree, excluding generated/local folders such as `.git`, `.venv`, and `__pycache__`:

```text
.
|-- .adk/
|   `-- artifacts/
|-- adk_ciro/
|   |-- __init__.py
|   |-- agent.py
|   |-- run_adk_demo.py
|   `-- tools.py
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
|   |   |-- crisis_detector.py
|   |   |-- execution_simulator.py
|   |   |-- impact_reporter.py
|   |   |-- iterative_agents.py
|   |   |-- response_planner.py
|   |   |-- signal_watcher.py
|   |   `-- situation_analyst.py
|   `-- services/
|       |-- artifacts.py
|       |-- confidence.py
|       |-- iterative_scenario_store.py
|       |-- mock_tools.py
|       `-- scenario_store.py
|-- dashboard/
|   |-- icons/
|   |   |-- icon-192.png
|   |   `-- icon-512.png
|   |-- index.html
|   |-- manifest.json
|   `-- sw.js
|-- logs/
|-- .env.example
|-- AGENTS.md
|-- antigravity-usage.md
|-- main.py
|-- PROJECT_SUMMARY.md
|-- README.md
|-- REPO_STRUCTURE.md
|-- requirements.txt
|-- simulate_inputs.py
`-- test_gemini_connection.py
```

Folder purposes:

| Path | Purpose |
|---|---|
| `main.py` | FastAPI application, dashboard route, API endpoints, PWA manifest/service worker routes. |
| `backend/` | Core deterministic and iterative CIRO orchestration logic. |
| `backend/agents/` | Legacy six-agent pipeline plus iterative agent wrappers. |
| `backend/services/` | Scenario stores, confidence scoring, mock tools, and artifact persistence. |
| `adk_ciro/` | Google ADK root agent, registered tools, and terminal demo runner. |
| `dashboard/` | Vanilla HTML/CSS/JS dashboard and PWA assets. |
| `artifacts/` | App-generated judge evidence: traces, risk scores, plans, reports, approval record. |
| `.adk/` | Antigravity/ADK local workflow artifacts. |
| `logs/` | Local runtime logs generated during server smoke tests or manual runs. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python |
| API server | FastAPI |
| ASGI server | Uvicorn |
| Data validation | Pydantic v2 |
| Agent framework | Google ADK |
| Reasoning model | Gemini, default `gemini-2.0-flash` |
| Gemini SDK | `google-genai` |
| Dashboard | Vanilla HTML, CSS, JavaScript |
| Mobile support | PWA manifest, service worker, install prompt, app icons |
| Artifacts | Local JSON and Markdown files |
| Scenario data | In-code simulated scenario stores |
| Map UI | Not currently implemented; Leaflet/OpenStreetMap map is planned. |

---

## Setup Instructions

Windows PowerShell:

```powershell
git clone <your-repo-url>
cd Antigravity_Hackthon

py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Create `.env` from the example:

```powershell
Copy-Item .env.example .env
notepad .env
```

Add a Google API key for ADK/Gemini demos:

```env
GOOGLE_API_KEY=your_google_api_key_here
```

The deterministic FastAPI dashboard can run without Gemini, but the ADK/Gemini demo requires `GOOGLE_API_KEY`.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_API_KEY` | Required for ADK/Gemini demo | Used by Google ADK and `google-genai` Gemini narration/test scripts. |
| `CIRO_ADK_MODEL` | Optional | Overrides Gemini model. Defaults to `gemini-2.0-flash`. |
| `GOOGLE_GENAI_USE_VERTEXAI` | Optional | `adk_ciro/agent.py` defaults this to `False` unless already configured. |

| `GROQ_API_KEY` | Optional / unused by current code | Present in `.env.example`; no active CIRO runtime dependency found. |
| `HUGGINGFACEHUB_API_TOKEN` | Optional / unused by current code | Present in `.env.example`; no active CIRO runtime dependency found. |

---

## Run Instructions

Run the web app demo:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8080
```

Open:

```text
http://127.0.0.1:8080/
```

If Windows raises `WinError 10013` or the port is unavailable, use another port:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Run the ADK terminal demo:

```powershell
python adk_ciro\run_adk_demo.py
```

Run the Google ADK web interface from the repository root:

```powershell
adk web
```

Check Gemini connectivity:

```powershell
python test_gemini_connection.py
```

Run the deterministic scenario simulator:

```powershell
python simulate_inputs.py
```

---

## Mobile PWA Demo

CIRO includes PWA support:

- `dashboard/manifest.json`
- `dashboard/sw.js`
- `dashboard/icons/icon-192.png`
- `dashboard/icons/icon-512.png`
- Service worker registration in `dashboard/index.html`
- Manifest route at `GET /manifest.json`
- Service worker route at `GET /sw.js`

Desktop install from localhost:

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8080
```

Open `http://127.0.0.1:8080/` in Chrome or Edge and use the browser install prompt when available.

Android install:

1. Serve the app from a secure HTTPS URL or HTTPS tunnel.
2. Open the URL in Chrome on Android.
3. Tap the browser menu.
4. Select **Install app** or **Add to Home screen**.

iOS install:

1. Serve the app from a secure HTTPS URL or HTTPS tunnel.
2. Open the URL in Safari on iOS.
3. Tap **Share**.
4. Select **Add to Home Screen**.

Mobile browsers require a secure context for service workers. Localhost is acceptable for local desktop testing; phone testing normally needs HTTPS.

---

## Demo Walkthrough

1. Start the FastAPI server.
2. Open the dashboard at `http://127.0.0.1:8080/`.
3. Select one of the iterative scenarios.
4. Click **Run Iterative Pipeline**.
5. Watch the crisis level, confidence, risk score, and agent timeline update.
6. Click Iteration 1, 2, and 3 to inspect the decision trace.
7. Review the action plan and simulated actions.
8. Open generated artifacts in the Artifact Viewer.
9. Show `final_crisis_report.md` in the Final Report panel.
10. Optionally run `python adk_ciro\run_adk_demo.py` to demonstrate the ADK/Gemini tool orchestration path.

---

## Demo Scenarios

| Scenario | Input Signals | Expected Detection | Expected Action | Expected Simulated Outcome |
|---|---|---|---|---|
| Islamabad G-10 urban flooding | Public flood reports, rainfall escalation, blocked G-10 roads. | Urban flooding with increasing confidence and road disruption. | Dispatch response unit, send warning, reroute around affected roads, prepare shelter when needed. | Simulated route updates, public alert, emergency ticket, and risk trend evaluation. |
| Peshawar Ring Road blast and blockage | Public blast reports, Ring Road blockage, diversion congestion. | Major accident / road blockage with ambulance access risk. | Dispatch from Peshawar simulation depot, alert public, reroute traffic, monitor diversion. | Simulated road avoidance, emergency ticket, and partial de-escalation when diversion improves. |
| Ambulance stuck during rain and congestion | Rain alert, severe congestion, ambulance delay reports. | Urban flooding / road blockage with ambulance delay risk. | Reroute ambulance path, send warning, dispatch response support. | Simulated reroute, improved speed state change, alert, and final monitoring recommendation. |

Each iterative scenario contains exactly three steps in `backend/services/iterative_scenario_store.py`.

---

## API Endpoints

Actual FastAPI routes in `main.py`:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Basic health check. |
| `GET` | `/api/scenarios` | List legacy one-pass scenarios. |
| `GET` | `/api/scenarios/{scenario_id}` | Get one legacy scenario. |
| `POST` | `/api/pipeline/run` | Run the legacy deterministic pipeline for a scenario. |
| `GET` | `/api/iterative/scenarios` | List three-iteration CIRO scenarios. |
| `GET` | `/api/iterative/scenarios/{scenario_id}` | Get one iterative scenario definition. |
| `POST` | `/api/iterative/run` | Run the full iterative CIRO pipeline and generate artifacts. |
| `GET` | `/api/artifacts` | List generated artifact files. |
| `GET` | `/api/artifacts/{filename}` | Read one generated JSON or Markdown artifact. |
| `GET` | `/` | Serve dashboard. |
| `GET` | `/dashboard/*` | Serve dashboard static files through FastAPI `StaticFiles`. |
| `GET` | `/manifest.json` | Serve PWA manifest. |
| `GET` | `/sw.js` | Serve PWA service worker with no-cache header. |
| `GET` | `/favicon.ico` | Empty favicon response. |

Example iterative API call:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8080/api/iterative/run `
  -ContentType "application/json" `
  -Body '{"scenario_id":"g10_urban_flooding"}'
```

---

## Artifacts / Logs

CIRO artifacts are app-generated decision evidence. They are written to `artifacts/` when the iterative pipeline runs.

Current artifact files:

| Artifact | Purpose |
|---|---|
| `scenario_input.json` | Latest iterative scenario definition used for the run. |
| `iteration_1_decision_trace.json` | Iteration 1 initial detection trace. |
| `iteration_2_replan_trace.json` | Iteration 2 updated-signal and re-plan trace. |
| `iteration_3_final_trace.json` | Iteration 3 final trace. |
| `risk_score.json` | Risk and confidence scores by iteration. |
| `agent_tool_calls.json` | Tool-call style records for each agent step. |
| `rescue_action_plan.md` | Human-readable simulated action plan. |
| `final_crisis_report.md` | Final crisis summary, confidence, risk, and plan. |
| `human_approval_record.json` | Prototype / simulated human approval record. |
| `codebase_analysis.md` | Repository analysis and safe customization plan. |

Current implementation overwrites these latest-run artifact filenames on each iterative run.

Difference between evidence types:

- **CIRO artifacts:** Runtime decision evidence generated by the app under `artifacts/`.
- **Antigravity activity/walkthrough logs:** IDE/session evidence, screenshots, or walkthrough recordings. These should be exported, screenshotted, or recorded separately for judging.

---

## Google Antigravity Usage

This repository follows a Google Antigravity-style workflow:

- Repository-aware incremental development and review.
- Artifact-first implementation evidence under `artifacts/`.
- Codebase analysis captured in `artifacts/codebase_analysis.md`.
- Additional workflow notes in `antigravity-usage.md`.
- Dashboard and generated reports designed for judge verification.

Runtime agent orchestration is implemented with Google ADK and the backend CIRO Commander loop. Antigravity session data is separate from CIRO runtime artifacts.

---

## Google ADK / Gemini Usage

Actual implementation:

- `adk_ciro/agent.py` loads `.env`, configures Gemini Developer API mode, defines `MODEL_NAME`, and creates `root_agent`.
- `root_agent` is a Google ADK `Agent` when `google.adk.agents.Agent` imports successfully.
- If ADK import fails, a local `FallbackAgent` object is created so the repository can still be inspected.
- `adk_ciro/tools.py` defines `CIRO_ADK_TOOLS` and registers them with the ADK root agent.
- `adk_ciro/run_adk_demo.py` demonstrates the ADK/Gemini path from the terminal.
- `test_gemini_connection.py` verifies `GOOGLE_API_KEY` and Gemini API access.

Registered ADK tools in `CIRO_ADK_TOOLS`:

- `list_iterative_scenarios_tool`
- `run_iterative_ciro_pipeline_tool`
- `list_ciro_artifacts_tool`
- `read_ciro_artifact_tool`
- `collect_screen_signal_tool` - prototype / simulated; uses static scenario posts and must not be interpreted as real screen monitoring.
- `run_signal_watcher_tool`
- `run_crisis_detector_tool`
- `run_situation_analyst_tool`
- `run_response_planner_tool`
- `run_execution_simulator_tool`
- `run_impact_reporter_tool`
- `run_full_ciro_pipeline_tool`

Gemini is used for the ADK root agent configuration and optional narration in `run_adk_demo.py`. Core scoring, verification, planning, execution simulation, and artifacts are deterministic Python outputs for repeatable judging.

---

## Safety and Privacy

CIRO is designed as a safe simulation prototype:

- No real emergency services are contacted.
- No real Rescue 1122, NDMA, police, ambulance, or public alert integration is connected.
- No real social media scraping is implemented.
- No CNIC/NIC collection is implemented.
- No sensitive personal data is required.
- Weather, traffic, and reports are simulated datasets.
- Contextual text analysis is permission-based and user-provided.
- The dashboard Mini Assistant analyzes only pasted text after explicit consent.
- Actions are simulation-only.
- Human approval is represented by a prototype approval record; interactive approve/reject workflow is planned.
- Do not paste private or sensitive data into the demo because approved demo text can appear in local traces/artifacts.

Use phrase for demo: **permission-based contextual emergency signal analysis**.

---

## Limitations

- Prototype / simulated APIs only.
- Not a production emergency response system.
- Not connected to real Rescue 1122, NDMA, police, ambulance dispatch, weather, traffic, map, or public alert systems.
- Dashboard is useful but intentionally minimal.
- Mobile support is an installable PWA, not a native Android app.
- Custom Urdu/English input is currently a dashboard Mini Assistant keyword prototype, not a dynamic full-pipeline scenario generator.
- Human approval is currently generated as a demo approval artifact, not an interactive approve/reject workflow.
- `collect_screen_signal_tool` is a legacy/prototype simulated ADK tool over static scenario posts; it should not be described as real screen reading.


---

## Future Work

- Real Google Maps integration after safety review.
- Privacy-safe verified community reporter mode.
- Real-time weather and traffic API integrations.
- Native Android app in addition to the PWA.
- Interactive human approval workflow with approve/reject history.
- Admin dashboard for scenario management.
- Stronger multilingual Urdu/Pashto/English signal extraction.
- Structured validation for dynamic custom crisis input.
- Safer artifact redaction for any user-supplied text.

---

## Evaluation Criteria Alignment

| Criteria | Weight | CIRO Evidence |
|---|---:|---|
| Google Antigravity | 25% | Antigravity-style artifact workflow, `artifacts/codebase_analysis.md`, `antigravity-usage.md`, repository-aware incremental implementation. |
| Agentic Reasoning | 20% | CIRO Commander loop, iterative agents, ADK root agent, Gemini model configuration, reasoning summaries. |
| Detection & Analysis | 20% | Signal extraction, crisis clustering, confidence math, severity scoring, multi-source verification. |
| Action Planning | 15% | Rescue planning, dispatch simulation, route updates, alerts, shelter preparation, limitations. |
| Technical Implementation | 10% | FastAPI, Pydantic schemas, deterministic backend, Google ADK tools, PWA dashboard, artifacts. |
| Innovation & UX | 10% | Installable PWA, judge-friendly dashboard, artifact viewer, Mini Assistant prototype, explainable reports. |

---

## Screenshots / Demo Video Placeholder

Add these before final submission:

- Dashboard screenshot: _add image or link_
- Agent trace screenshot: _add image or link_
- Map before/after screenshot: _planned until map feature is implemented_
- Artifact viewer screenshot: _add image or link_
- Demo video link: _add link_

---

## Troubleshooting

### `WinError 10013` or port already in use

Use a different local port:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

or:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 9000
```

### Missing `GOOGLE_API_KEY`

Create `.env` and add:

```env
GOOGLE_API_KEY=your_google_api_key_here
```

Then run:

```powershell
python test_gemini_connection.py
```

### Dependency installation issues

Upgrade pip inside the virtual environment and reinstall:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### PowerShell activation blocked

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### PWA service worker cache shows old dashboard

In Chrome or Edge:

1. Open DevTools.
2. Go to **Application**.
3. Open **Service Workers**.
4. Click **Update** or **Unregister**.
5. Hard refresh the page.

You can also change ports during local testing to avoid stale local cache confusion.

### ADK import unavailable

Install requirements and confirm `google-adk` is installed:

```powershell
pip install -r requirements.txt
python adk_ciro\run_adk_demo.py
```

If ADK still fails, the deterministic FastAPI dashboard remains available, but the ADK web demo will not run until the dependency issue is fixed.

---

## License / Team

**Status:** Hackathon prototype.  
**Team:** Zahir Ahmad.  
**License:** Add an explicit open-source license before public production use.

