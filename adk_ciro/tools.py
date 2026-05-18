from __future__ import annotations

from typing import Any, Callable

from backend.agent_pipeline import run_pipeline_by_id
from backend.agents.crisis_detector import run_crisis_detector
from backend.agents.execution_simulator import run_execution_simulator
from backend.agents.impact_reporter import run_impact_reporter
from backend.agents.response_planner import run_response_planner
from backend.agents.signal_watcher import run_signal_watcher
from backend.agents.situation_analyst import run_situation_analyst
from backend.iterative_pipeline import run_iterative_pipeline_by_id
from backend.schemas import CrisisDetectorOutput, ScenarioInput, SignalWatcherOutput
from backend.services.artifacts import list_artifacts, read_artifact
from backend.services.iterative_scenario_store import list_iterative_scenarios
from backend.services.scenario_store import get_scenario


def _dump(model: Any) -> dict[str, Any]:
    return model.model_dump(mode="json")


def _scenario(scenario_id: str) -> ScenarioInput:
    return get_scenario(scenario_id)


def _watcher(scenario: ScenarioInput) -> SignalWatcherOutput:
    return run_signal_watcher(scenario)


def _detector(scenario: ScenarioInput, watcher_output: SignalWatcherOutput) -> CrisisDetectorOutput:
    return run_crisis_detector(scenario, watcher_output)


def _run_to_situation(scenario_id: str):
    scenario = _scenario(scenario_id)
    watcher_output = _watcher(scenario)
    detector_output = _detector(scenario, watcher_output)
    analyst_output = run_situation_analyst(scenario, detector_output)
    return scenario, watcher_output, detector_output, analyst_output


def _safe_tool_call(tool_name: str, scenario_id: str, fn: Callable[[], dict[str, Any]]) -> dict[str, Any]:
    try:
        payload = fn()
    except KeyError as exc:
        return {
            "tool": tool_name,
            "scenario_id": scenario_id,
            "ok": False,
            "error": str(exc),
        }
    except Exception as exc:
        return {
            "tool": tool_name,
            "scenario_id": scenario_id,
            "ok": False,
            "error": f"{type(exc).__name__}: {exc}",
        }
    payload["tool"] = tool_name
    payload["scenario_id"] = scenario_id
    payload["ok"] = True
    return payload


def _safe_call(tool_name: str, fn: Callable[[], dict[str, Any]]) -> dict[str, Any]:
    try:
        payload = fn()
    except Exception as exc:
        return {
            "tool": tool_name,
            "ok": False,
            "error": f"{type(exc).__name__}: {exc}",
        }
    payload["tool"] = tool_name
    payload["ok"] = True
    return payload


def list_iterative_scenarios_tool() -> dict[str, Any]:
    """List CIRO's three iterative crisis-response demo scenarios."""

    def _run() -> dict[str, Any]:
        scenarios = list_iterative_scenarios()
        return {
            "scenarios": [
                {
                    "scenario_id": scenario.scenario_id,
                    "title": scenario.title,
                    "iterations": len(scenario.steps),
                    "description": scenario.description,
                }
                for scenario in scenarios
            ]
        }

    return _safe_call("list_iterative_scenarios_tool", _run)


def run_iterative_ciro_pipeline_tool(scenario_id: str) -> dict[str, Any]:
    """Run the CIRO Commander iterative Observe-Verify-Reason-Plan-Act-Evaluate-Re-plan loop."""

    def _run() -> dict[str, Any]:
        output = run_iterative_pipeline_by_id(scenario_id)
        return {
            "agent": "ciro_commander",
            "scenario_name": output.scenario_name,
            "iterations_count": len(output.iterations),
            "final_crisis_level": output.final_crisis_level,
            "final_confidence_score": output.final_confidence_score,
            "artifact_files": output.artifact_files,
            "mini_assistant_summary": output.mini_assistant_summary,
            "output": _dump(output),
        }

    return _safe_tool_call("run_iterative_ciro_pipeline_tool", scenario_id, _run)


def list_ciro_artifacts_tool() -> dict[str, Any]:
    """List generated CIRO artifacts from the local artifacts directory."""

    def _run() -> dict[str, Any]:
        return {"artifacts": list_artifacts()}

    return _safe_call("list_ciro_artifacts_tool", _run)


def read_ciro_artifact_tool(filename: str) -> dict[str, Any]:
    """Read one generated CIRO artifact by filename."""

    def _run() -> dict[str, Any]:
        return {"filename": filename, "content": read_artifact(filename)}

    return _safe_call("read_ciro_artifact_tool", _run)


def collect_screen_signal_tool(scenario_id: str) -> dict[str, Any]:
    """Simulate the Siri-like screen-reading signal collection layer."""

    def _run() -> dict[str, Any]:
        scenario = _scenario(scenario_id)
        screen_events: list[dict[str, Any]] = []
        for post in scenario.social_posts:
            screen_events.append(
                {
                    "post_id": post.post_id,
                    "dwell_time_seconds": 10,
                    "source": "social_screen_read",
                    "extracted_text": post.text,
                    "detected_language": post.language.value,
                    "content_type": "text_post",
                    "bgc_decision": "REAL",
                    "timestamp": post.timestamp.isoformat(),
                    "privacy_note": (
                        "Raw screen content is used only to extract crisis fields; CIRO stores "
                        "an anonymized signal dictionary, not personal browsing behavior."
                    ),
                }
            )

        return {
            "scenario_title": scenario.title,
            "collector": "simulated_siri_like_screen_reader",
            "activation_rule": "10 second dwell-time threshold",
            "screen_events": screen_events,
            "weather_api_available": True,
            "traffic_api_available": True,
            "production_equivalent_schema": {
                "source": "social_screen_read",
                "dwell_time_seconds": 10,
                "content_type": "text_post | video_speech | video_caption",
                "bgc_decision": "REAL | ENTERTAINMENT",
            },
        }

    return _safe_tool_call("collect_screen_signal_tool", scenario_id, _run)


def run_signal_watcher_tool(scenario_id: str) -> dict[str, Any]:
    """Run Agent 1 Signal Watcher through the deterministic backend."""

    def _run() -> dict[str, Any]:
        scenario = _scenario(scenario_id)
        output = _watcher(scenario)
        return {
            "agent": "signal_watcher",
            "signals_count": len(output.signals),
            "ignored_count": len(output.ignored_inputs),
            "reasoning_chain": output.reasoning_chain,
            "output": _dump(output),
        }

    return _safe_tool_call("run_signal_watcher_tool", scenario_id, _run)


def run_crisis_detector_tool(scenario_id: str) -> dict[str, Any]:
    """Run Agent 2 Crisis Detector through the deterministic backend."""

    def _run() -> dict[str, Any]:
        scenario = _scenario(scenario_id)
        watcher_output = _watcher(scenario)
        output = _detector(scenario, watcher_output)
        selected = output.selected_cluster
        return {
            "agent": "crisis_detector",
            "clusters_count": len(output.clusters),
            "selected_cluster_id": selected.cluster_id if selected else None,
            "escalation": selected.escalation.value if selected else "no_escalation",
            "reasoning_chain": output.reasoning_chain,
            "output": _dump(output),
        }

    return _safe_tool_call("run_crisis_detector_tool", scenario_id, _run)


def run_situation_analyst_tool(scenario_id: str) -> dict[str, Any]:
    """Run Agent 3 Situation Analyst through the deterministic backend."""

    def _run() -> dict[str, Any]:
        _, _, _, output = _run_to_situation(scenario_id)
        analysis = output.analysis
        return {
            "agent": "situation_analyst",
            "detected_situation": analysis.detected_situation,
            "confidence": analysis.confidence.final_score,
            "severity_score": analysis.severity_score,
            "escalation": analysis.escalation.value,
            "primary_risks": analysis.primary_risks,
            "secondary_risks": analysis.secondary_risks,
            "reasoning_chain": output.reasoning_chain,
            "output": _dump(output),
        }

    return _safe_tool_call("run_situation_analyst_tool", scenario_id, _run)


def run_response_planner_tool(scenario_id: str) -> dict[str, Any]:
    """Run Agent 4 Response Planner through the deterministic backend."""

    def _run() -> dict[str, Any]:
        scenario, _, _, analyst_output = _run_to_situation(scenario_id)
        output = run_response_planner(scenario, analyst_output)
        return {
            "agent": "response_planner",
            "should_escalate": output.plan.should_escalate,
            "actions_count": len(output.plan.actions),
            "selected_depot": output.plan.selected_depot,
            "selected_shelter": output.plan.selected_shelter,
            "reasoning_chain": output.reasoning_chain,
            "output": _dump(output),
        }

    return _safe_tool_call("run_response_planner_tool", scenario_id, _run)


def run_execution_simulator_tool(scenario_id: str) -> dict[str, Any]:
    """Run Agent 5 Execution Simulator through the deterministic backend."""

    def _run() -> dict[str, Any]:
        scenario, _, _, analyst_output = _run_to_situation(scenario_id)
        planner_output = run_response_planner(scenario, analyst_output)
        output = run_execution_simulator(scenario, analyst_output, planner_output)
        return {
            "agent": "execution_simulator",
            "system_status": output.execution.system_status,
            "route_updates_count": len(output.execution.route_updates),
            "alerts_sent_count": len(output.execution.alerts_sent),
            "tickets_created_count": len(output.execution.tickets_created),
            "state_changes_count": len(output.execution.state_changes),
            "reasoning_chain": output.reasoning_chain,
            "output": _dump(output),
        }

    return _safe_tool_call("run_execution_simulator_tool", scenario_id, _run)


def run_impact_reporter_tool(scenario_id: str) -> dict[str, Any]:
    """Run Agent 6 Impact Reporter through the deterministic backend."""

    def _run() -> dict[str, Any]:
        scenario, _, _, analyst_output = _run_to_situation(scenario_id)
        planner_output = run_response_planner(scenario, analyst_output)
        simulator_output = run_execution_simulator(scenario, analyst_output, planner_output)
        output = run_impact_reporter(analyst_output, planner_output, simulator_output)
        return {
            "agent": "impact_reporter",
            "summary": output.report.summary,
            "impact_score": output.report.impact_score,
            "remaining_risk": output.report.remaining_risk,
            "no_escalation_reason": output.report.no_escalation_reason,
            "reasoning_chain": output.reasoning_chain,
            "output": _dump(output),
        }

    return _safe_tool_call("run_impact_reporter_tool", scenario_id, _run)


def run_full_ciro_pipeline_tool(scenario_id: str) -> dict[str, Any]:
    """Run the full CIRO backend pipeline and return a dictionary result."""

    def _run() -> dict[str, Any]:
        output = run_pipeline_by_id(scenario_id)
        return {
            "agent": "full_ciro_pipeline",
            "final_status": output.final_status.value,
            "confidence": output.situation_analyst.analysis.confidence.final_score,
            "severity_score": output.situation_analyst.analysis.severity_score,
            "actions_count": len(output.response_planner.plan.actions),
            "system_status": output.execution_simulator.execution.system_status,
            "logs": [log.model_dump(mode="json") for log in output.logs],
            "output": _dump(output),
        }

    return _safe_tool_call("run_full_ciro_pipeline_tool", scenario_id, _run)


CIRO_ADK_TOOLS = [
    list_iterative_scenarios_tool,
    run_iterative_ciro_pipeline_tool,
    list_ciro_artifacts_tool,
    read_ciro_artifact_tool,
    collect_screen_signal_tool,
    run_signal_watcher_tool,
    run_crisis_detector_tool,
    run_situation_analyst_tool,
    run_response_planner_tool,
    run_execution_simulator_tool,
    run_impact_reporter_tool,
    run_full_ciro_pipeline_tool,
]
