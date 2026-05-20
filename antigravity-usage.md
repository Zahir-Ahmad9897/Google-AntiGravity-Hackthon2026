# CIRO Antigravity And Google ADK Usage

## What Antigravity Does In This Project

CIRO uses Google Antigravity as the agentic development environment for planning, implementing, and verifying a multi-agent crisis workflow. The project is structured so judges can see planning, decision, execution, and impact as separate stages instead of a single black-box script.

## What Google ADK Does

Google ADK is added as the orchestration layer in `adk_ciro/`.

The existing deterministic backend agents remain stable in `backend/`. They are exposed to ADK as Python tools:

- `collect_screen_signal_tool`
- `run_signal_watcher_tool`
- `run_crisis_detector_tool`
- `run_situation_analyst_tool`
- `run_response_planner_tool`
- `run_execution_simulator_tool`
- `run_impact_reporter_tool`
- `run_full_ciro_pipeline_tool`

Each tool returns a Python dictionary only. Gemini/ADK can plan the sequence, call these tools, inspect the outputs, and produce an agent trace. The deterministic backend remains the source of truth for confidence math, severity, escalation, response actions, and simulation state changes.

## ADK Root Agent

The root ADK agent is defined in:

```text
adk_ciro/agent.py
```

Agent name:

```text
ciro_orchestrator
```

Instruction summary:

```text
Plan, call tools in sequence, verify outputs, and produce an agent trace.
Demonstrate planning decision execution impact.
Do not invent locations.
Use deterministic backend tools for calculations and state changes.
```

## Why The Backend Is Deterministic

The deterministic Python backend prevents demo instability:

- Scenario 1 always shows exact G-10 flood evidence.
- Scenario 5 always remains low-confidence and does not escalate.
- Confidence and severity are calculated from visible formulas.
- Response planning uses approved Islamabad depots, roads, and shelters only.

ADK/Gemini orchestrates the workflow; the backend tools perform the safety-critical calculations.

## Permission-Based Input Layer

CIRO does not implement background screen monitoring or automatic social scraping. For the hackathon, contextual public reports are supplied only through predefined demo scenarios or user-approved pasted content in the Mini Assistant.

The compatible ADK helper `collect_screen_signal_tool(scenario_id)` now represents permission-based public-context input only. The schema focuses on:

- `source = user_approved_public_context`
- `extracted_text`
- `detected_language`
- `content_type`
- `permission_granted`
- `privacy_note`

This keeps the demo focused on agent reasoning while preserving simulation-only safety.

## Commands To Run

Install dependencies:

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Run the ADK proof demo:

```powershell
.venv\Scripts\python.exe adk_ciro\run_adk_demo.py
```

Run the ADK web UI:

```powershell
adk web .
```

If the virtual environment is not activated, use the local executable:

```powershell
.venv\Scripts\adk.exe web .
```

If `adk web` cannot find the agent, run it from the project root:

```powershell
cd D:\Antigravity_Hackthon
.venv\Scripts\adk.exe web .
```

## Graceful Fallback

If `google-adk` is not installed or Gemini credentials are unavailable, `adk_ciro/agent.py` still exposes a fallback `root_agent` object named `ciro_orchestrator`, and `adk_ciro/run_adk_demo.py` still runs the same tool sequence locally.

This fallback does not replace ADK. It exists so backend verification and judge-grade deterministic outputs remain runnable while the environment is being configured.

To enable live ADK orchestration:

1. Install dependencies with `.venv\Scripts\python.exe -m pip install -r requirements.txt`.
2. Configure Gemini or Vertex AI credentials for Google ADK.
3. Run `adk web` from `D:\Antigravity_Hackthon`.
4. Select `ciro_orchestrator`.
5. Ask it to run `scenario_1` or `scenario_5`.

## Judge-Facing Proof Points

- Antigravity is used for agentic development and verification.
- Google ADK is used as the orchestration layer.
- Gemini/ADK root agent has tool access to each CIRO backend stage.
- Deterministic tools preserve safety-critical confidence and escalation behavior.
- Scenario 1 demonstrates crisis escalation with exact evidence.
- Scenario 5 demonstrates anti-false-alert behavior with passive monitoring.
