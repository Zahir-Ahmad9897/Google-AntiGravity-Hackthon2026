from __future__ import annotations

from typing import List

from backend.schemas import (
    AgentName,
    EscalationLevel,
    ExecutionSimulatorOutput,
    ImpactReport,
    ImpactReporterOutput,
    ResponsePlannerOutput,
    SituationAnalystOutput,
)


def run_impact_reporter(
    analyst_output: SituationAnalystOutput,
    planner_output: ResponsePlannerOutput,
    simulator_output: ExecutionSimulatorOutput,
) -> ImpactReporterOutput:
    analysis = analyst_output.analysis
    plan = planner_output.plan
    execution = simulator_output.execution
    reasoning_chain: List[str] = [
        "Compared pre-action crisis state against simulated execution outputs."
    ]

    if analysis.escalation == EscalationLevel.NO_ESCALATION or not plan.should_escalate:
        no_escalation_reason = (
            f"Confidence {analysis.confidence.final_score} is below escalation threshold and "
            f"source diversity is {analysis.confidence.source_type_count}; no emergency action was generated."
        )
        report = ImpactReport(
            summary="No confirmed crisis impact: CIRO stayed in monitoring mode.",
            before_after=[],
            impact_score=0.0,
            remaining_risk="Low. Continue passive monitoring for new corroborating signals.",
            no_escalation_reason=no_escalation_reason,
            reasoning_chain=[
                no_escalation_reason,
                "This prevents over-alerting on weak or stale single-source reports.",
            ],
        )
        return ImpactReporterOutput(
            agent_name=AgentName.IMPACT_REPORTER,
            report=report,
            reasoning_chain=report.reasoning_chain,
        )

    impact_score = _impact_score(
        state_change_count=len(execution.state_changes),
        alert_count=len(execution.alerts_sent),
        ticket_count=len(execution.tickets_created),
    )
    remaining_risk = _remaining_risk(analysis.severity_score)
    summary = (
        f"Simulated response for {analysis.detected_situation}: "
        f"{len(execution.route_updates)} route update(s), {len(execution.alerts_sent)} alert(s), "
        f"and {len(execution.tickets_created)} emergency ticket(s)."
    )
    reasoning_chain.extend(
        [
            f"Impact score {impact_score} is based on simulated state changes, alerts, and emergency tickets.",
            f"Remaining risk after simulation: {remaining_risk}",
        ]
    )

    report = ImpactReport(
        summary=summary,
        before_after=execution.state_changes,
        impact_score=impact_score,
        remaining_risk=remaining_risk,
        no_escalation_reason=None,
        reasoning_chain=reasoning_chain,
    )

    return ImpactReporterOutput(
        agent_name=AgentName.IMPACT_REPORTER,
        report=report,
        reasoning_chain=reasoning_chain,
    )


def _impact_score(state_change_count: int, alert_count: int, ticket_count: int) -> float:
    score = 0.35 + min(state_change_count, 5) * 0.08 + alert_count * 0.1 + ticket_count * 0.15
    return round(min(score, 1.0), 2)


def _remaining_risk(severity_score: int) -> str:
    if severity_score >= 5:
        return "High. Dispatch and routing reduce exposure, but field confirmation is still required."
    if severity_score >= 4:
        return "Medium. Initial response is active, with congestion and public safety still monitored."
    return "Low to medium. Response actions should be enough unless new signals arrive."
