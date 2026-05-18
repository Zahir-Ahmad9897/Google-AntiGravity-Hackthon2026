from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Callable

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
load_dotenv(dotenv_path=PROJECT_ROOT / ".env")

from adk_ciro.agent import ADK_AVAILABLE, ADK_IMPORT_ERROR, MODEL_NAME, root_agent
from adk_ciro.tools import (
    collect_screen_signal_tool,
    list_ciro_artifacts_tool,
    list_iterative_scenarios_tool,
    run_crisis_detector_tool,
    run_execution_simulator_tool,
    run_full_ciro_pipeline_tool,
    run_impact_reporter_tool,
    run_iterative_ciro_pipeline_tool,
    run_response_planner_tool,
    run_signal_watcher_tool,
    run_situation_analyst_tool,
)


SCENARIOS = ["g10_urban_flooding", "peshawar_ring_road_blast", "ambulance_rain_congestion"]


ADK_PLAN = [
    "Plan: select one of CIRO's three iterative crisis scenarios.",
    "Loop: run Observe, Verify, Reason, Plan, Act, Evaluate, and Re-plan for three iterations.",
    "Execution: simulate rescue alerts, reroutes, road marking, and dashboard updates only after approval.",
    "Artifacts: verify decision traces, risk score, action plan, tool calls, approval record, and final report.",
]


def _divider() -> str:
    return "=" * 82


def _call_tool(
    scenario_id: str,
    tool_fn: Callable[[str], dict[str, Any]],
    calls: list[str],
) -> dict[str, Any]:
    calls.append(tool_fn.__name__)
    result = tool_fn(scenario_id)
    if not result.get("ok"):
        raise RuntimeError(f"{tool_fn.__name__} failed: {result.get('error')}")
    return result


def _print_plan() -> None:
    print("ADK plan")
    for index, step in enumerate(ADK_PLAN, start=1):
        print(f"  {index}. {step}")


def _print_agent_3_reasoning(reasoning_chain: list[str]) -> None:
    print("Agent 3 reasoning")
    for index, step in enumerate(reasoning_chain, start=1):
        print(f"  {index}. {step}")


def _format_actions(actions: list[dict[str, Any]]) -> list[str]:
    if not actions:
        return ["No simulated emergency actions; passive monitoring only."]
    formatted: list[str] = []
    for action in actions:
        formatted.append(
            f"{action['action_type']} -> {action['target']} "
            f"(priority {action['priority']}, status {action['status']})"
        )
    return formatted


def run_scenario(scenario_id: str) -> dict[str, Any]:
    calls: list[str] = []

    print()
    print(_divider())
    print(f"ADK CIRO iterative orchestration demo: {scenario_id}")
    print(_divider())
    _print_plan()

    available = list_iterative_scenarios_tool()
    if not available.get("ok"):
        raise RuntimeError(f"list_iterative_scenarios_tool failed: {available.get('error')}")
    calls.append("list_iterative_scenarios_tool")

    iterative = _call_tool(scenario_id, run_iterative_ciro_pipeline_tool, calls)
    artifacts = list_ciro_artifacts_tool()
    if not artifacts.get("ok"):
        raise RuntimeError(f"list_ciro_artifacts_tool failed: {artifacts.get('error')}")
    calls.append("list_ciro_artifacts_tool")

    output = iterative["output"]
    iterations = output["iterations"]

    print()
    print("Tools called")
    for index, tool_name in enumerate(calls, start=1):
        print(f"  {index}. {tool_name}")

    print()
    print("Three-iteration outcome")
    for trace in iterations:
        print(
            f"  Iteration {trace['iteration_number']}: level={trace['crisis_level']}, "
            f"confidence={trace['confidence_score']}, risk={trace['risk_score']}"
        )
        print(f"    Evaluation: {trace['evaluation_result']}")

    print()
    print("Simulated actions")
    for action in iterations[-1]["simulated_actions"]:
        print(f"  - {action}")

    print()
    print("Artifacts")
    for artifact in output["artifact_files"]:
        print(f"  - {artifact}")

    return {
        "scenario_id": scenario_id,
        "scenario_name": output["scenario_name"],
        "confidence": output["final_confidence_score"],
        "escalation": output["final_crisis_level"],
        "iterations_count": len(iterations),
        "artifacts_count": len(output["artifact_files"]),
        "outcome": iterations[-1]["evaluation_result"],
        "tools_called": calls,
    }


def _gemini_narration(summary: list[dict[str, Any]]) -> dict[str, str]:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return {"status": "missing_key", "text": "Gemini narration skipped: GOOGLE_API_KEY is missing."}

    prompt = (
        "Summarize this CIRO ADK demo in 5 concise judge-facing bullets. "
        "Do not change any scores or escalation decisions. "
        f"Demo summary JSON: {json.dumps(summary, ensure_ascii=True)}"
    )

    try:
        from google import genai
        from google.genai.errors import ClientError

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        return {"status": "success", "text": (response.text or "").strip()}
    except ClientError as exc:
        message = str(exc)
        if "RESOURCE_EXHAUSTED" in message or "429" in message:
            return {"status": "quota_exhausted", "text": message}
        return {"status": "error", "text": f"Gemini narration failed: {type(exc).__name__}: {exc}"}
    except Exception as exc:
        return {"status": "error", "text": f"Gemini narration failed: {type(exc).__name__}: {exc}"}


def _print_optional_narration(summary: list[dict[str, Any]]) -> None:
    print()
    print("Optional narration")
    if os.getenv("CIRO_SKIP_NARRATION", "").lower() in {"1", "true", "yes"}:
        print("Gemini narration skipped by CIRO_SKIP_NARRATION; deterministic CIRO tools continue unchanged.")
        return

    gemini = _gemini_narration(summary)

    if gemini["status"] == "success":
        print("Gemini narration used for demo summary; core CIRO tools and ADK structure unchanged.")
        print(gemini["text"])
        return

    if gemini["status"] == "quota_exhausted":
        print("Gemini returned 429 RESOURCE_EXHAUSTED; deterministic CIRO tools continue unchanged.")
        print("Optional narration skipped; core CIRO tools and ADK structure remain Google-first.")
        return

    print(gemini["text"])
    print("Core CIRO tools and ADK structure unchanged.")


def main() -> int:
    print(_divider())
    print("CIRO Google ADK / Antigravity orchestration proof")
    print(_divider())
    print(f"Root agent: {root_agent.name}")
    print(f"Gemini model: {MODEL_NAME}")
    print(f"ADK import available: {ADK_AVAILABLE}")
    if not ADK_AVAILABLE:
        print(f"ADK fallback active: {ADK_IMPORT_ERROR}")
        print("Install google-adk and run `adk web` to use live Gemini tool orchestration.")

    summaries: list[dict[str, Any]] = []
    for scenario_id in SCENARIOS:
        summaries.append(run_scenario(scenario_id))

    _print_optional_narration(summaries)

    print()
    print(_divider())
    print("ADK demo complete.")
    print(_divider())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
