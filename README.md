# CIRO: Crisis Intelligence & Response Orchestrator

**AISeekho2026 Antigravity Hackathon Submission**  
**Team:** Zahir Ahmad

CIRO is an agentic crisis-response system for fragmented emergency signals. It fuses simulated weather, traffic, public emergency reports, and user-approved contextual inputs, then runs an iterative response loop:

**Observe -> Verify -> Reason -> Plan -> Act -> Evaluate -> Re-plan**

Each main demo scenario runs through three iterations and produces decision traces, risk scores, simulated actions, approval records, and final reports.

---

## Tech Stack

- **Core Agent Framework:** Google ADK
- **Reasoning Model:** Google Gemini 2.0 Flash
- **Backend API:** FastAPI, Uvicorn
- **Validation:** Pydantic v2
- **Dashboard:** Vanilla HTML, CSS, JavaScript
- **Artifacts:** Local JSON and Markdown files under `artifacts/`

---

## Current Architecture

CIRO preserves the original deterministic six-agent pipeline and adds a nine-agent iterative commander layer.

Legacy deterministic pipeline:

1. Signal Watcher
2. Crisis Detector
3. Situation Analyst
4. Response Planner
5. Execution Simulator
6. Impact Reporter

Iterative commander layer:

1. CIRO Commander Agent
2. Weather Risk Agent
3. Traffic Analysis Agent
4. Social/Public Signal Agent
5. Verification Agent
6. Crisis Reasoning Agent
7. Rescue Planning Agent
8. Action Execution Agent
9. Evaluation/Replanning Agent

The iterative layer reuses the deterministic pipeline for scoring, severity, planning, and simulated execution. This keeps the demo repeatable while still demonstrating multi-agent orchestration and re-planning.

---

## Demo Scenarios

- `g10_urban_flooding`: Islamabad G-10 urban flooding
- `peshawar_ring_road_blast`: Peshawar Ring Road blast and blockage
- `ambulance_rain_congestion`: Ambulance stuck during rain and congestion

Each scenario has:

- Iteration 1: initial detection
- Iteration 2: updated corroborating signals
- Iteration 3: re-planning, escalation, or de-escalation

---

## Privacy And Safety

- CIRO Mini Assistant asks permission before contextual text analysis.
- It reads only user-approved visible emergency context.
- It ignores unrelated/private content.
- No hidden screen reading is implied or performed.
- No real emergency service, map, public alert, or authority API is contacted.
- All action execution is simulated and requires a human approval record.

---

## Artifact Outputs

Each iterative run writes the latest artifacts to `artifacts/`:

- `codebase_analysis.md`
- `scenario_input.json`
- `iteration_1_decision_trace.json`
- `iteration_2_replan_trace.json`
- `iteration_3_final_trace.json`
- `risk_score.json`
- `agent_tool_calls.json`
- `rescue_action_plan.md`
- `final_crisis_report.md`
- `human_approval_record.json`

---

## Setup

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Add your Google API key to `.env`:

```env
GOOGLE_API_KEY=your_api_key_here
```

---

## Run

Dashboard:

```powershell
uvicorn main:app --port 8000
```

Open `http://localhost:8000`.

ADK terminal demo:

```powershell
python adk_ciro\run_adk_demo.py
```

Skip optional Gemini narration and run deterministic orchestration only:

```powershell
$env:CIRO_SKIP_NARRATION="1"
python adk_ciro\run_adk_demo.py
```

ADK web interface:

```powershell
adk web
```

---

## API Routes

- `GET /health`
- `GET /api/scenarios`
- `POST /api/pipeline/run`
- `GET /api/iterative/scenarios`
- `POST /api/iterative/run`
- `GET /api/artifacts`
- `GET /api/artifacts/{filename}`

The legacy one-pass endpoints remain available for regression checks.

---

## Verification Commands

```powershell
python simulate_inputs.py
python -c "from backend.iterative_pipeline import run_iterative_pipeline_by_id; print(run_iterative_pipeline_by_id('g10_urban_flooding').final_crisis_level)"
```
