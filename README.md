# CIRO - Crisis Intelligence & Response Orchestrator

**Tagline:** Agentic crisis intelligence that turns fragmented emergency signals into explainable simulated response plans.  
**Hackathon:** Google Antigravity / AISeekho2026  
**Status:** Hackathon prototype, simulation-only, not a real emergency dispatch system.

CIRO demonstrates how Google ADK, Gemini, FastAPI, Google Maps Platform, and an installable PWA can support crisis detection, verification, routing awareness, and simulated response planning.

## Executive Summary

Emergency information often arrives as scattered weather alerts, traffic disruptions, public reports, and operator observations. CIRO converts those signals into a structured multi-agent workflow:

```text
Observe -> Verify -> Reason -> Plan -> Act -> Evaluate -> Re-plan
```

The system runs predefined crisis scenarios and custom user-approved crisis reports. It produces confidence scores, concise reasoning summaries, simulated rescue plans, map/weather/route intelligence, and judge-readable artifacts under `artifacts/`.

CIRO does not contact real emergency authorities, send real alerts, scrape social media, monitor screens, or dispatch responders.

## Problem Statement

Crisis operators need to make fast decisions from incomplete and noisy signals. Weather, road closures, public reports, and rescue availability are often separated across systems. CIRO shows a safe prototype for combining these signals into an explainable crisis-response loop with clear artifacts for review.

## Solution Overview

CIRO provides:

- Google ADK orchestration around deterministic Python crisis agents.
- Gemini-compatible tool wrappers for scenario execution and artifact review.
- FastAPI backend for scenarios, artifacts, Google API context, and custom input.
- Google Maps Platform integration for geocoding, weather context, and route alternatives.
- Fallback mock mode when Google APIs or keys are unavailable.
- Installable PWA dashboard for desktop and mobile demos.
- Expo React Native Field Officer app under `mobile/`.
- Permission-based Mini Assistant for pasted public/user-approved crisis content.

## Key Features

- Three predefined iterative demo scenarios.
- Custom user-defined crisis scenario from approved pasted text.
- Weather Risk, Traffic Analysis, Public Signal, Verification, Reasoning, Planning, Execution, and Evaluation agents.
- Crisis map with red blocked route and green alternate route.
- Weather Intelligence and Route Intelligence panels.
- Human approval record for simulation.
- Artifacts for traceability and judging.
- No real emergency execution.

## Challenge Requirement Mapping

| Requirement | CIRO Implementation |
|---|---|
| Multi-source signals | Simulated weather, traffic, public reports, and user-approved custom input. |
| Event detection | Signal Watcher, Crisis Detector, and Mini Assistant extraction. |
| Reasoning | Confidence scoring, crisis level, severity, concise summaries. |
| Action planning | Rescue Planning Agent generates simulated dispatch, reroute, alert, and shelter steps. |
| Action execution | Execution Simulator only; no real dispatch or public alert. |
| Outcome visualization | Dashboard metrics, timeline, map, weather panel, route panel, outcome panel, artifacts. |
| Agentic workflow | ADK root agent plus deterministic CIRO Commander loop. |
| Mobile app | Installable PWA plus Expo React Native Field Officer app prototype. |
| Logs/artifacts | JSON and Markdown artifacts under `artifacts/`. |

## Evaluation Alignment

| Criteria | Evidence |
|---|---|
| Technical depth | FastAPI backend, ADK tools, Pydantic schemas, Google API wrappers, fallback logic. |
| Agentic design | Explicit Observe -> Verify -> Reason -> Plan -> Act -> Evaluate -> Re-plan loop. |
| Explainability | Iteration traces, risk scores, final report, action plan, tool-call trace. |
| Safety | Simulation-only, permission-based input, no scraping, no hidden monitoring. |
| Demo readiness | Dashboard, PWA, predefined scenarios, custom scenario, artifacts. |

## Architecture

```text
Dashboard / PWA
    |
    v
FastAPI main.py
    |
    +-- Scenario APIs
    +-- Mini Assistant APIs
    +-- Weather / Route APIs
    +-- Artifact APIs
    |
    v
backend/iterative_pipeline.py
    |
    v
CIRO Commander Agent Loop
    |
    +-- Weather Risk Agent
    +-- Traffic Analysis Agent
    +-- Social/Public Signal Agent
    +-- Verification Agent
    +-- Crisis Reasoning Agent
    +-- Rescue Planning Agent
    +-- Action Execution Agent
    +-- Evaluation/Replanning Agent
    |
    v
Artifacts + Map/Weather/Route Traces
```

Google ADK path:

```text
adk_ciro/agent.py -> ADK root_agent
adk_ciro/tools.py -> backend pipeline/artifact tools
```

## Agent Workflow

| Step | Behavior |
|---|---|
| Observe | Collect simulated weather, traffic, and approved public/contextual reports. |
| Verify | Deduplicate signals, remove noise, calculate confidence inputs. |
| Reason | Infer crisis type, severity, location, affected roads, and confidence. |
| Plan | Create simulated rescue, reroute, shelter, and alert plan. |
| Act | Simulate only after approval; no real public systems are contacted. |
| Evaluate | Compare before/after state and remaining risk. |
| Re-plan | Continue the next iteration or finalize the report. |

## Agent Responsibilities

| Agent | Responsibility |
|---|---|
| CIRO Commander Agent | Coordinates lifecycle, iterations, shared state, and artifacts. |
| Weather Risk Agent | Evaluates rainfall, alerts, and weather risk. |
| Traffic Analysis Agent | Detects blockage, congestion, and ambulance-delay risk. |
| Social/Public Signal Agent | Reads only approved public/demo context. |
| Verification Agent | Deduplicates and validates crisis signals. |
| Crisis Reasoning Agent | Produces crisis level, severity, and concise reasoning. |
| Rescue Planning Agent | Builds simulated response plan. |
| Action Execution Agent | Simulates route updates, alerts, tickets, and state changes. |
| Evaluation/Replanning Agent | Measures outcome and determines next iteration. |

## Repository Structure

```text
.
|-- adk_ciro/                 # Google ADK root agent and tool wrappers
|-- backend/
|   |-- agents/               # Deterministic crisis agents
|   |-- services/             # Artifacts, scenarios, Google APIs, Mini Assistant
|   |-- iterative_pipeline.py # Three-iteration commander loop
|   `-- schemas.py            # Pydantic domain models
|-- dashboard/                # Vanilla dashboard and PWA files
|-- mobile/                   # Expo React Native Field Officer app
|-- artifacts/                # Judge-readable JSON/Markdown evidence
|-- main.py                   # FastAPI app
|-- requirements.txt
|-- .env.example
`-- README.md
```

## Tech Stack

- Python 3.11+
- FastAPI
- Pydantic v2
- Google ADK
- Google GenAI / Gemini
- Google Maps Platform: Maps JavaScript, Geocoding, Weather, Routes
- Vanilla HTML/CSS/JavaScript dashboard
- PWA manifest and service worker
- Expo React Native mobile app

## Setup - Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` locally. Do not commit real values.

## Environment Variables

```env
GOOGLE_API_KEY=your_gemini_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
CIRO_ENV=development
```

`GOOGLE_API_KEY` is used for Gemini / ADK.  
`GOOGLE_MAPS_API_KEY` is used for Google Maps Platform context.  
If keys are missing, CIRO keeps running in fallback mock mode.

## Google API Setup

Enable these APIs in Google Cloud:

- Gemini API / Google AI Studio key for `GOOGLE_API_KEY`
- Maps JavaScript API
- Geocoding API
- Weather API
- Routes API
- Places API (New), optional for future expansion

Security note: browser map rendering requires a public browser key. Restrict `GOOGLE_MAPS_API_KEY` in Google Cloud Console by:

- API restrictions: allow only required Maps Platform APIs.
- Application restrictions: HTTP referrers/domains for the demo host.
- Separate production keys for server-side and browser use if deploying beyond the hackathon prototype.

## Run

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8080
```

Open:

```text
http://127.0.0.1:8080
```

If Windows returns `WinError 10013` or port 8080 is occupied, use another local port:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8081
```

## Docker / Cloud Run

No Dockerfile is currently included. Docker and Cloud Run deployment are planned future work for the prototype.

## PWA Mobile App

CIRO is an installable PWA. No Android Studio is required.

Android:

1. Run the FastAPI server.
2. Open the dashboard URL in Chrome.
3. Use browser menu -> Install app or Add to Home screen.

iOS:

1. Open the dashboard URL in Safari.
2. Tap Share.
3. Tap Add to Home Screen.

PWA files:

- `dashboard/manifest.json`
- `dashboard/sw.js`
- `dashboard/icons/icon-192.png`
- `dashboard/icons/icon-512.png`

## Expo Field Officer App

The repository also includes a React Native + Expo prototype under `mobile/`. It is a CIRO Field Officer App for Android demos.

Current LAN demo links:

```text
exp://10.44.102.12:19000
http://10.44.102.12:19000
```

Run it with:

```powershell
cd mobile
npm install
$env:EXPO_PUBLIC_CIRO_API_URL="http://10.44.102.12:8082"
npm run start:lan
```

Use `http://10.0.2.2:8082` for Android emulator. Use `npm run start:tunnel` if phone and laptop LAN discovery fails. If the phone shows a failed remote update, re-check the laptop Wi-Fi IP, run `npm install`, then restart Expo with `npm run start:clear`. The app uses live CIRO endpoints when available and mock fallback data when the backend is offline.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check. |
| GET | `/api/config` | Safe frontend config and browser Maps key status. |
| GET | `/api/scenarios` | Legacy scenario list. |
| POST | `/api/pipeline/run` | Legacy one-pass pipeline. |
| GET | `/api/iterative/scenarios` | Iterative scenario list. |
| POST | `/api/iterative/run` | Run predefined three-iteration scenario. |
| GET | `/api/weather?location=...` | Weather update with Google/fallback source. |
| GET | `/api/route?origin=...&destination=...&blocked_area=...` | Route update with original and alternate route. |
| POST | `/api/mini-assistant/extract` | Extract approved pasted crisis signal. |
| POST | `/api/iterative/run-custom` | Run custom approved input through CIRO loop. |
| GET | `/api/artifacts` | List generated artifacts. |
| GET | `/api/artifacts/{filename}` | Read one artifact. |

## Demo Walkthrough

1. Start FastAPI.
2. Open the dashboard.
3. Select a predefined scenario.
4. Click Run Iterative Pipeline.
5. Review crisis level, confidence, risk score, agent timeline, action plan, simulated actions, final report, artifacts.
6. Switch map Before/After to compare red blocked route and green alternate route.
7. Use Mini Assistant with approved pasted crisis content and run a custom scenario.

## Demo Scenarios

- Islamabad G-10 urban flooding
- Peshawar Ring Road blast and road blockage
- Ambulance stuck during rain and congestion
- Custom user-defined approved crisis scenario

## CIRO Mini Assistant

The Mini Assistant accepts only content the user intentionally pastes or shares. The user must check:

```text
I confirm this is public or user-approved emergency-related content.
```

It extracts:

- crisis relevance
- crisis type
- location
- urgency
- confidence
- language
- roads, areas, hazards, time mentions
- short reasoning summary

If the text is unrelated, CIRO shows `No emergency signal detected` and does not run the custom pipeline.

## Map, Weather, And Rerouting

Map behavior:

- Crisis marker at selected scenario/custom location.
- Weather risk marker.
- Rescue/ambulance marker.
- Before response: original/blocked route in red.
- After simulation: recommended alternate route in green.

Weather panel:

- location
- condition
- precipitation/rainfall
- temperature if available
- risk level
- confidence
- Google Weather API or mock fallback source

Route panel:

- origin
- destination
- blocked/congested road
- original route status
- alternate route status
- estimated duration and distance
- rerouting reason
- Google Routes API or mock fallback source

## Artifacts And Logs

Important artifacts:

| Artifact | Purpose |
|---|---|
| `scenario_input.json` | Latest predefined/custom scenario input. |
| `iteration_1_decision_trace.json` | Iteration 1 trace. |
| `iteration_2_replan_trace.json` | Iteration 2 trace. |
| `iteration_3_final_trace.json` | Iteration 3 trace. |
| `risk_score.json` | Confidence and risk summary. |
| `rescue_action_plan.md` | Simulated response plan. |
| `final_crisis_report.md` | Final judge-facing report. |
| `agent_tool_calls.json` | Agent/tool call style trace. |
| `google_api_trace.json` | Sanitized Google API success/fallback trace. |
| `map_route_trace.json` | Map markers and route geometry. |
| `weather_signal_trace.json` | Weather intelligence summary. |
| `mini_assistant_signal.json` | Latest custom extraction output. |
| `custom_scenario_input.json` | Latest custom scenario built from approved input. |
| `custom_iteration_trace.json` | Latest custom iterative run trace. |

## Antigravity Trace Submission

Use the dashboard artifacts plus Antigravity logs as submission evidence. Do not include `.env`, service account files, credentials, or local secrets. If packaging Antigravity logs, keep the generated archive separate from source unless the challenge explicitly requests it.

## Google Antigravity / ADK / Gemini Usage

- `adk_ciro/agent.py` defines the ADK root agent.
- `adk_ciro/tools.py` exposes backend functions as ADK tools.
- `python adk_ciro\run_adk_demo.py` runs a terminal ADK-style demo.
- Gemini narration is optional; deterministic CIRO agents still run if Gemini quota is unavailable.

## Safety And Privacy

- Simulation only.
- No real emergency dispatch.
- No real public alerts.
- No automatic Facebook, Twitter/X, Instagram, or WhatsApp scraping.
- No background screen monitoring.
- Mini Assistant analyzes only pasted user-approved content.
- Artifacts avoid storing secrets.

## Limitations

- Google APIs depend on configured quota and enabled APIs.
- Weather API fields may vary; fallback mode keeps the demo functional.
- Route geometry is simplified when fallback mocks are used.
- The PWA is an installable web app, not a native Android/iOS app.
- This is not production emergency infrastructure.

## Future Work

- Separate server-only and browser-only Google Maps keys.
- Optional Places API search for depots, hospitals, and shelters.
- Dockerfile and Cloud Run deployment.
- Role-based operator authentication.
- Production-grade incident audit store.
- Human-in-the-loop approval UI before each simulated action.

## Screenshots / Demo Video Placeholders

- Screenshot: dashboard overview.
- Screenshot: map before response with red blocked route.
- Screenshot: map after response with green alternate route.
- Screenshot: Mini Assistant custom scenario.
- Demo video: predefined scenario run.
- Demo video: custom approved crisis input run.

## Troubleshooting

| Issue | Fix |
|---|---|
| `WinError 10013` | Use another port such as 8081 or stop the process occupying 8080. |
| Missing `GOOGLE_API_KEY` | Add it to local `.env`; ADK/Gemini narration may be skipped without it. |
| Missing `GOOGLE_MAPS_API_KEY` | Add it to local `.env`; map/weather/route use fallback mocks without it. |
| Dependency install fails | Recreate `.venv`, upgrade pip, then run `pip install -r requirements.txt`. |
| API fallback mode | Check `artifacts/google_api_trace.json` for sanitized failure summaries. |
| PWA cache stale | Hard refresh, unregister service worker in DevTools, or bump `CACHE_NAME` in `dashboard/sw.js`. |

## Final Submission Checklist

- `.env` is not committed.
- `.env.example` contains placeholders only.
- `.gitignore` does not hide required `artifacts/*.json` or `artifacts/*.md`.
- README is current and honest about prototype limits.
- Predefined scenarios run.
- Custom Mini Assistant run works.
- Artifacts are generated.
- Dashboard map/weather/route panels work with Google APIs or fallback mocks.
- PWA manifest and service worker are present.
- No claim of real emergency execution.
