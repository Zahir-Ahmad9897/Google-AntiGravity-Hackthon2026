from __future__ import annotations

from typing import Any, List

from backend.agents.iterative_agents import (
    run_action_execution_agent,
    run_commander_agent,
    run_crisis_reasoning_agent,
    run_evaluation_replanning_agent,
    run_legacy_pipeline_consistency_check,
    run_public_signal_agent,
    run_rescue_planning_agent,
    run_traffic_analysis_agent,
    run_verification_agent,
    run_weather_risk_agent,
)
from backend.iterative_schemas import (
    AgentStepOutput,
    AgentToolCallRecord,
    HumanApprovalRecord,
    IterationTrace,
    IterativePipelineResult,
    RiskScoreRecord,
)
from backend.schemas import ResponsePlannerOutput, SituationAnalystOutput
from backend.services.artifacts import save_artifact
from backend.services.iterative_scenario_store import get_iterative_scenario


ITERATION_TRACE_FILES = {
    1: "iteration_1_decision_trace.json",
    2: "iteration_2_replan_trace.json",
    3: "iteration_3_final_trace.json",
}


def run_iterative_pipeline_by_id(scenario_id: str) -> IterativePipelineResult:
    scenario_definition = get_iterative_scenario(scenario_id)
    approval = _approval_record(scenario_id)
    traces: List[IterationTrace] = []
    tool_calls: List[AgentToolCallRecord] = []
    artifact_files: List[str] = []
    latest_planner: ResponsePlannerOutput | None = None
    latest_analyst: SituationAnalystOutput | None = None

    artifact_files.append(save_artifact("scenario_input.json", scenario_definition))
    artifact_files.append(save_artifact("human_approval_record.json", approval))

    previous_trace: IterationTrace | None = None
    for step in scenario_definition.steps:
        agent_outputs: List[AgentStepOutput] = []

        commander = run_commander_agent(scenario_definition.title, step, previous_trace)
        agent_outputs.append(commander)
        _record_call(tool_calls, step.iteration_number, commander.agent_name, "iteration_loop_state", "Manage scenario lifecycle and shared state.")

        weather = run_weather_risk_agent(step)
        agent_outputs.append(weather)
        _record_call(tool_calls, step.iteration_number, weather.agent_name, "get_weather_signal", "Analyze rainfall, alert level, and storm/flood risk.")

        traffic = run_traffic_analysis_agent(step)
        agent_outputs.append(traffic)
        _record_call(tool_calls, step.iteration_number, traffic.agent_name, "get_traffic_signal", "Detect road blockage, congestion, and ambulance delay risk.")

        public_signal = run_public_signal_agent(step)
        agent_outputs.append(public_signal)
        _record_call(tool_calls, step.iteration_number, public_signal.agent_name, "get_public_reports", "Read only authorized emergency-relevant public context.")

        verification, _watcher_output, detector_output, signal_risk_score = run_verification_agent(step.scenario)
        agent_outputs.append(verification)
        _record_call(tool_calls, step.iteration_number, verification.agent_name, "verify_signals", "Deduplicate signals and compute confidence.")

        reasoning, analyst_output = run_crisis_reasoning_agent(step.scenario, detector_output)
        agent_outputs.append(reasoning)
        _record_call(tool_calls, step.iteration_number, reasoning.agent_name, "run_situation_analyst", "Determine crisis level from verified evidence.")

        planning, planner_output = run_rescue_planning_agent(step.scenario, analyst_output)
        agent_outputs.append(planning)
        _record_call(tool_calls, step.iteration_number, planning.agent_name, "generate_rescue_plan", "Generate constrained rescue, reroute, warning, and shelter plan.")

        execution, simulator_output = run_action_execution_agent(step.scenario, analyst_output, planner_output, approval)
        agent_outputs.append(execution)
        _record_call(tool_calls, step.iteration_number, execution.agent_name, "simulate_action", "Simulate actions only after human approval.")

        risk_score = _combined_risk_score(signal_risk_score, analyst_output)
        evaluation, _reporter_output, evaluation_result, next_step = run_evaluation_replanning_agent(
            analyst_output,
            planner_output,
            simulator_output,
            previous_trace,
            risk_score,
            step.iteration_number,
        )
        agent_outputs.append(evaluation)
        _record_call(tool_calls, step.iteration_number, evaluation.agent_name, "run_impact_reporter", "Evaluate outcome and decide next iteration.")

        run_legacy_pipeline_consistency_check(step.scenario)
        _record_call(
            tool_calls,
            step.iteration_number,
            "CIRO Commander Agent",
            "run_full_ciro_pipeline",
            "Verify iterative state against the preserved deterministic backend.",
        )

        trace = IterationTrace(
            scenario_id=scenario_definition.scenario_id,
            scenario_name=scenario_definition.title,
            iteration_number=step.iteration_number,
            input_sources=_input_sources(step.permission_granted, step.scenario),
            agent_outputs=agent_outputs,
            confidence_score=analyst_output.analysis.confidence.final_score,
            concise_reasoning_summary=_concise_reasoning_summary(analyst_output),
            action_plan=_action_plan_lines(planner_output),
            simulated_actions=execution.actions,
            evaluation_result=evaluation_result,
            next_step=next_step,
            approval_status=approval.approval_status,
            crisis_level=analyst_output.analysis.escalation.value,
            risk_score=risk_score,
        )
        traces.append(trace)
        previous_trace = trace
        latest_planner = planner_output
        latest_analyst = analyst_output

        filename = ITERATION_TRACE_FILES[step.iteration_number]
        artifact_files.append(save_artifact(filename, trace))
        _record_call(tool_calls, step.iteration_number, "CIRO Commander Agent", "save_artifact", f"Saved {filename}.")

    risk_record = _risk_record(scenario_definition.scenario_id, scenario_definition.title, traces)
    rescue_plan = _rescue_action_plan_markdown(scenario_definition.title, traces, approval)
    final_report = _final_crisis_report_markdown(scenario_definition.title, traces, approval, latest_planner, latest_analyst)

    artifact_files.append(save_artifact("risk_score.json", risk_record))
    artifact_files.append(save_artifact("agent_tool_calls.json", [call.model_dump(mode="json") for call in tool_calls]))
    artifact_files.append(save_artifact("rescue_action_plan.md", rescue_plan))
    artifact_files.append(save_artifact("final_crisis_report.md", final_report))

    final_trace = traces[-1]
    return IterativePipelineResult(
        scenario_id=scenario_definition.scenario_id,
        scenario_name=scenario_definition.title,
        description=scenario_definition.description,
        iterations=traces,
        risk_score=risk_record,
        agent_tool_calls=tool_calls,
        rescue_action_plan=rescue_plan,
        final_crisis_report=final_report,
        human_approval=approval,
        artifact_files=artifact_files,
        final_crisis_level=final_trace.crisis_level,
        final_confidence_score=final_trace.confidence_score,
        mini_assistant_summary=(
            "CIRO Mini Assistant requested permission first, analyzed only authorized visible public context, "
            "ignored unrelated/private content, and emitted emergency-relevant signals only."
        ),
        latest_artifact="final_crisis_report.md",
    )


def _approval_record(scenario_id: str) -> HumanApprovalRecord:
    return HumanApprovalRecord(
        scenario_id=scenario_id,
        approved=True,
        approval_status="approved_for_simulation",
        approved_by="demo_operator",
        approval_scope=[
            "Read authorized demo public emergency reports.",
            "Use simulated weather and traffic feeds.",
            "Generate simulated rescue plans and dashboard updates.",
        ],
        privacy_constraints=[
            "No hidden screen reading.",
            "No private messages stored.",
            "No real emergency services contacted.",
            "All actions are simulation only.",
        ],
    )


def _record_call(
    calls: List[AgentToolCallRecord],
    iteration_number: int,
    agent_name: str,
    tool_name: str,
    purpose: str,
) -> None:
    calls.append(
        AgentToolCallRecord(
            iteration_number=iteration_number,
            agent_name=agent_name,
            tool_name=tool_name,
            purpose=purpose,
            status="completed",
            simulated=True,
        )
    )


def _input_sources(permission_granted: bool, scenario: Any) -> List[str]:
    sources = ["simulated_weather", "simulated_traffic"]
    if permission_granted and scenario.social_posts:
        sources.append("user_approved_public_reports")
    return sources


def _combined_risk_score(signal_risk_score: float, analyst_output: SituationAnalystOutput) -> float:
    analysis = analyst_output.analysis
    score = (
        0.45 * signal_risk_score
        + 0.35 * analysis.confidence.final_score
        + 0.2 * (analysis.severity_score / 5)
    )
    return round(min(1.0, score), 2)


def _concise_reasoning_summary(analyst_output: SituationAnalystOutput) -> str:
    analysis = analyst_output.analysis
    roads = ", ".join(analysis.affected_roads) if analysis.affected_roads else "no severe road blockage"
    return (
        f"{analysis.detected_situation}; confidence={analysis.confidence.final_score}; "
        f"severity={analysis.severity_score}/5; affected roads={roads}."
    )


def _action_plan_lines(planner_output: ResponsePlannerOutput) -> List[str]:
    if not planner_output.plan.actions:
        return ["Monitor only; no simulated emergency action generated."]
    return [
        f"{action.action_type.value} -> {action.target}: {action.description}"
        for action in planner_output.plan.actions
    ]


def _risk_record(scenario_id: str, scenario_name: str, traces: List[IterationTrace]) -> RiskScoreRecord:
    return RiskScoreRecord(
        scenario_id=scenario_id,
        scenario_name=scenario_name,
        iteration_scores=[
            {
                "iteration_number": trace.iteration_number,
                "risk_score": trace.risk_score,
                "confidence_score": trace.confidence_score,
                "crisis_level": trace.crisis_level,
            }
            for trace in traces
        ],
        final_score=traces[-1].risk_score,
        final_crisis_level=traces[-1].crisis_level,
    )


def _rescue_action_plan_markdown(
    scenario_name: str,
    traces: List[IterationTrace],
    approval: HumanApprovalRecord,
) -> str:
    lines = [
        f"# Rescue Action Plan: {scenario_name}",
        "",
        f"Approval status: **{approval.approval_status}**",
        "",
        "All actions below are simulated. No public alert, route API, or emergency authority was contacted.",
        "",
    ]
    for trace in traces:
        lines.extend(
            [
                f"## Iteration {trace.iteration_number}",
                f"- Crisis level: {trace.crisis_level}",
                f"- Confidence: {trace.confidence_score}",
                f"- Risk score: {trace.risk_score}",
                "- Action plan:",
            ]
        )
        lines.extend([f"  - {line}" for line in trace.action_plan])
        lines.append("")
    return "\n".join(lines)


def _final_crisis_report_markdown(
    scenario_name: str,
    traces: List[IterationTrace],
    approval: HumanApprovalRecord,
    latest_planner: ResponsePlannerOutput | None,
    latest_analyst: SituationAnalystOutput | None,
) -> str:
    final_trace = traces[-1]
    lines = [
        f"# Final Crisis Report: {scenario_name}",
        "",
        f"- Final crisis level: {final_trace.crisis_level}",
        f"- Final confidence: {final_trace.confidence_score}",
        f"- Final risk score: {final_trace.risk_score}",
        f"- Human approval: {approval.approval_status}",
        "- Safety: simulation only; no real emergency integrations used.",
        "",
        "## Iteration Summary",
    ]
    for trace in traces:
        lines.extend(
            [
                f"- Iteration {trace.iteration_number}: {trace.evaluation_result}",
                f"  Next step: {trace.next_step}",
            ]
        )

    if latest_analyst is not None:
        analysis = latest_analyst.analysis
        lines.extend(
            [
                "",
                "## Final Reasoning Summary",
                (
                    f"{analysis.detected_situation} with severity {analysis.severity_score}/5, "
                    f"confidence {analysis.confidence.final_score}, and affected roads "
                    f"{', '.join(analysis.affected_roads) if analysis.affected_roads else 'none'}."
                ),
            ]
        )

    if latest_planner is not None:
        lines.extend(["", "## Latest Simulated Plan"])
        if latest_planner.plan.actions:
            lines.extend([f"- {line}" for line in _action_plan_lines(latest_planner)])
        else:
            lines.append("- Monitor only; no simulated emergency action generated.")

    return "\n".join(lines)
