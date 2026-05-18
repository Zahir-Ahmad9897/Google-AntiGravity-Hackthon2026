from __future__ import annotations

from typing import Any, List, Tuple

from backend.agent_pipeline import run_pipeline
from backend.agents.crisis_detector import run_crisis_detector
from backend.agents.execution_simulator import run_execution_simulator
from backend.agents.impact_reporter import run_impact_reporter
from backend.agents.response_planner import run_response_planner
from backend.agents.signal_watcher import run_signal_watcher
from backend.agents.situation_analyst import run_situation_analyst
from backend.iterative_schemas import AgentStepOutput, HumanApprovalRecord, IterationTrace, IterativeScenarioStep
from backend.schemas import (
    CrisisDetectorOutput,
    ExecutionSimulatorOutput,
    ImpactReporterOutput,
    PipelineResult,
    ResponsePlannerOutput,
    ScenarioInput,
    SignalWatcherOutput,
    SituationAnalystOutput,
)
from backend.services.mock_tools import (
    calculate_risk_score,
    get_public_reports,
    get_traffic_signal,
    get_weather_signal,
    verify_signals,
)


def run_commander_agent(
    scenario_name: str,
    step: IterativeScenarioStep,
    previous_trace: IterationTrace | None,
) -> AgentStepOutput:
    if previous_trace is None:
        summary = "Started scenario lifecycle and initialized shared crisis state."
        transition = "initial_detection"
    else:
        summary = f"Loaded prior crisis level {previous_trace.crisis_level} and prepared updated signal pass."
        transition = "updated_signal_review"

    return AgentStepOutput(
        agent_name="CIRO Commander Agent",
        summary=summary,
        confidence_score=1.0,
        reasoning_summary=(
            f"Iteration {step.iteration_number} runs Observe, Verify, Reason, Plan, Act, Evaluate, Re-plan "
            f"for {scenario_name}."
        ),
        output={
            "iteration": step.iteration_number,
            "transition": transition,
            "update_note": step.update_note,
            "shared_state_keys": ["scenario", "signals", "confidence", "plan", "actions", "evaluation"],
        },
        actions=["coordinate_agents", "maintain_shared_state", "control_iteration_loop"],
    )


def run_weather_risk_agent(step: IterativeScenarioStep) -> AgentStepOutput:
    scenario = step.scenario
    weather_signal = get_weather_signal(scenario.weather.district, scenario)
    rainfall = scenario.weather.rainfall_mm_per_hour
    alert_level = scenario.weather.alert_level
    confidence = min(1.0, round((rainfall / 12.0) * 0.55 + (alert_level / 5.0) * 0.35 + (0.1 if scenario.weather.alert_active else 0.0), 2))

    if rainfall >= 8.0 or alert_level >= 3:
        severity = "high"
    elif rainfall >= 5.0 or scenario.weather.alert_active:
        severity = "medium"
    else:
        severity = "low"

    return AgentStepOutput(
        agent_name="Weather Risk Agent",
        summary=f"Weather risk is {severity}; rainfall={rainfall}mm/hr, alert_active={scenario.weather.alert_active}.",
        confidence_score=confidence,
        reasoning_summary=(
            "Weather severity is derived from rainfall intensity, alert activity, and alert level using mock PMD-style data."
        ),
        output={
            "weather_signal": weather_signal,
            "severity": severity,
            "flood_or_storm_detected": severity in {"medium", "high"},
        },
        actions=["analyze_weather_signal"],
    )


def run_traffic_analysis_agent(step: IterativeScenarioStep) -> AgentStepOutput:
    scenario = step.scenario
    traffic_signals = get_traffic_signal(scenario.title, scenario)
    blocked = [
        report
        for report in scenario.traffic
        if report.speed_kmh <= 5.0 or report.congestion_level >= 4
    ]
    ambulance_mentioned = any("ambulance" in post.text.lower() for post in scenario.social_posts)
    ambulance_delay_risk = ambulance_mentioned and bool(blocked)
    alternate_routes = _alternate_route_suggestions([report.road_name for report in blocked])
    confidence = min(1.0, round(0.35 + len(blocked) * 0.18 + (0.15 if ambulance_delay_risk else 0.0), 2))

    if blocked:
        summary = f"Detected {len(blocked)} blocked or severely congested road segment(s)."
    else:
        summary = "Traffic is degraded but no severe blockage is verified yet."

    return AgentStepOutput(
        agent_name="Traffic Analysis Agent",
        summary=summary,
        confidence_score=confidence,
        reasoning_summary=(
            "Traffic risk is based on mock speed, normal speed, congestion level, and ambulance-delay keywords."
        ),
        output={
            "traffic_signals": traffic_signals,
            "blocked_roads": [report.road_name for report in blocked],
            "ambulance_delay_risk": ambulance_delay_risk,
            "alternate_routes": alternate_routes,
        },
        actions=["detect_road_blockage", "estimate_ambulance_delay", "suggest_alternate_routes"],
    )


def run_public_signal_agent(step: IterativeScenarioStep) -> AgentStepOutput:
    scenario = step.scenario
    if not step.permission_granted:
        return AgentStepOutput(
            agent_name="Social/Public Signal Agent",
            summary="Permission was not granted; no contextual public content was read.",
            confidence_score=0.0,
            reasoning_summary="Privacy rule blocked public-context ingestion for this iteration.",
            output={"permission_granted": False, "emergency_reports": [], "raw_private_content_stored": False},
            actions=["skip_contextual_reading"],
        )

    reports = get_public_reports(scenario.title, scenario)
    emergency_reports = [
        report
        for report in reports
        if _is_emergency_relevant(str(report.get("text", "")))
    ]
    ignored_count = len(reports) - len(emergency_reports)
    confidence = min(1.0, round(0.3 + len(emergency_reports) * 0.25, 2))

    return AgentStepOutput(
        agent_name="Social/Public Signal Agent",
        summary=f"Read {len(emergency_reports)} authorized emergency-relevant public report(s).",
        confidence_score=confidence,
        reasoning_summary=(
            "Only user-approved visible public reports were analyzed; unrelated or private content is ignored."
        ),
        output={
            "permission_granted": True,
            "approved_context": step.approved_context,
            "emergency_reports": emergency_reports,
            "ignored_unrelated_or_private_count": ignored_count,
            "raw_private_content_stored": False,
        },
        actions=["request_permission", "extract_authorized_emergency_signals"],
    )


def run_verification_agent(
    scenario: ScenarioInput,
) -> Tuple[AgentStepOutput, SignalWatcherOutput, CrisisDetectorOutput, float]:
    watcher_output = run_signal_watcher(scenario)
    detector_output = run_crisis_detector(scenario, watcher_output)
    verification = verify_signals(watcher_output.signals)
    risk_score = calculate_risk_score(watcher_output.signals)

    selected = detector_output.selected_cluster
    confidence = selected.confidence.final_score if selected else 0.0
    source_count = selected.confidence.source_type_count if selected else 0

    return (
        AgentStepOutput(
            agent_name="Verification Agent",
            summary=(
                f"Verified {verification['verified_count']} unique crisis signal(s) across {source_count} source type(s)."
            ),
            confidence_score=confidence,
            reasoning_summary=(
                "Signals are deduplicated by source, location, and crisis type before confidence scoring."
            ),
            output={
                "signal_watcher": watcher_output.model_dump(mode="json"),
                "crisis_detector": detector_output.model_dump(mode="json"),
                "verification": verification,
                "risk_score": risk_score,
            },
            actions=["verify_signals", "remove_duplicates", "calculate_confidence"],
        ),
        watcher_output,
        detector_output,
        risk_score,
    )


def run_crisis_reasoning_agent(
    scenario: ScenarioInput,
    detector_output: CrisisDetectorOutput,
) -> Tuple[AgentStepOutput, SituationAnalystOutput]:
    analyst_output = run_situation_analyst(scenario, detector_output)
    analysis = analyst_output.analysis

    return (
        AgentStepOutput(
            agent_name="Crisis Reasoning Agent",
            summary=f"{analysis.detected_situation}; crisis level={analysis.escalation.value}.",
            confidence_score=analysis.confidence.final_score,
            reasoning_summary="; ".join(analysis.reasoning_chain[:3]),
            output=analyst_output.model_dump(mode="json"),
            actions=["determine_crisis_level", "connect_multi_source_evidence"],
        ),
        analyst_output,
    )


def run_rescue_planning_agent(
    scenario: ScenarioInput,
    analyst_output: SituationAnalystOutput,
) -> Tuple[AgentStepOutput, ResponsePlannerOutput]:
    planner_output = run_response_planner(scenario, analyst_output)
    actions = [
        f"{action.action_type.value}: {action.description}"
        for action in planner_output.plan.actions
    ]
    confidence = analyst_output.analysis.confidence.final_score if actions else 0.4

    return (
        AgentStepOutput(
            agent_name="Rescue Planning Agent",
            summary=f"Generated {len(actions)} simulated rescue planning action(s).",
            confidence_score=confidence,
            reasoning_summary="; ".join(planner_output.reasoning_chain[:3]),
            output=planner_output.model_dump(mode="json"),
            actions=actions,
        ),
        planner_output,
    )


def run_action_execution_agent(
    scenario: ScenarioInput,
    analyst_output: SituationAnalystOutput,
    planner_output: ResponsePlannerOutput,
    approval: HumanApprovalRecord,
) -> Tuple[AgentStepOutput, ExecutionSimulatorOutput]:
    simulator_output = run_execution_simulator(scenario, analyst_output, planner_output)
    execution = simulator_output.execution
    simulated_actions = _simulated_action_lines(execution)
    approval_note = "approved_for_simulation" if approval.approved else "blocked_without_human_approval"

    return (
        AgentStepOutput(
            agent_name="Action Execution Agent",
            summary=f"Simulation status={execution.system_status}; approval={approval_note}.",
            confidence_score=analyst_output.analysis.confidence.final_score,
            reasoning_summary="All actions are simulated; no authority, API, or public network was contacted.",
            output={
                "approval_status": approval.approval_status,
                "simulation_only": True,
                "execution": simulator_output.model_dump(mode="json"),
            },
            actions=simulated_actions,
        ),
        simulator_output,
    )


def run_evaluation_replanning_agent(
    analyst_output: SituationAnalystOutput,
    planner_output: ResponsePlannerOutput,
    simulator_output: ExecutionSimulatorOutput,
    previous_trace: IterationTrace | None,
    current_risk_score: float,
    iteration_number: int,
) -> Tuple[AgentStepOutput, ImpactReporterOutput, str, str]:
    reporter_output = run_impact_reporter(analyst_output, planner_output, simulator_output)
    trend = _risk_trend(previous_trace, current_risk_score)
    if iteration_number < 3:
        next_step = "Continue monitoring and run the next iteration with updated signals."
    else:
        next_step = "Finalize crisis report and preserve artifacts for review."

    evaluation_result = f"{trend}. {reporter_output.report.summary}"

    return (
        AgentStepOutput(
            agent_name="Evaluation/Replanning Agent",
            summary=trend,
            confidence_score=analyst_output.analysis.confidence.final_score,
            reasoning_summary=(
                "Evaluation compares current risk, crisis level, simulated impact, and prior iteration state."
            ),
            output=reporter_output.model_dump(mode="json"),
            actions=["evaluate_outcome", "decide_escalation_or_deescalation", "set_next_iteration"],
        ),
        reporter_output,
        evaluation_result,
        next_step,
    )


def run_legacy_pipeline_consistency_check(scenario: ScenarioInput) -> PipelineResult:
    return run_pipeline(scenario)


def _is_emergency_relevant(text: str) -> bool:
    terms = (
        "pani",
        "paani",
        "flood",
        "rain",
        "traffic",
        "road",
        "block",
        "blast",
        "ambulance",
        "urgent",
        "congestion",
        "sealed",
        "stuck",
        "phans",
    )
    lowered = text.lower()
    return any(term in lowered for term in terms)


def _alternate_route_suggestions(blocked_roads: List[str]) -> List[str]:
    approved = [
        "Srinagar Highway G-10 underpass",
        "Margalla Road sector crossing",
        "Khayaban-e-Iqbal",
        "Peshawar Ring Road",
        "University Road diversion",
    ]
    suggestions = [road for road in approved if road not in blocked_roads]
    return suggestions[:2] or ["nearest open arterial road"]


def _simulated_action_lines(execution: Any) -> List[str]:
    lines: List[str] = []
    lines.extend(execution.route_updates)
    lines.extend(execution.alerts_sent)
    lines.extend(
        [
            f"Simulated ticket {ticket.ticket_id} assigned to {ticket.assigned_depot}."
            for ticket in execution.tickets_created
        ]
    )
    for change in execution.state_changes:
        lines.append(f"{change.metric}: {change.before} -> {change.after}")
    return lines or ["No simulated action executed; monitoring state retained."]


def _risk_trend(previous_trace: IterationTrace | None, current_risk_score: float) -> str:
    if previous_trace is None:
        return "Initial detection baseline established"
    delta = round(current_risk_score - previous_trace.risk_score, 2)
    if delta >= 0.1:
        return f"Escalated: risk increased by {delta}"
    if delta <= -0.1:
        return f"De-escalated: risk decreased by {abs(delta)}"
    return "Re-planned: risk level stayed similar but latest signals updated the plan"
