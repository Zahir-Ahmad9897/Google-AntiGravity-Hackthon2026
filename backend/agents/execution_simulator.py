from __future__ import annotations

from typing import List

from backend.schemas import (
    ActionStatus,
    ActionType,
    AgentName,
    EmergencyTicket,
    ExecutionSimulatorOutput,
    ResponsePlannerOutput,
    ScenarioInput,
    SimulatedExecution,
    SimulationStateChange,
    SituationAnalystOutput,
)


def run_execution_simulator(
    scenario: ScenarioInput,
    analyst_output: SituationAnalystOutput,
    planner_output: ResponsePlannerOutput,
) -> ExecutionSimulatorOutput:
    plan = planner_output.plan
    analysis = analyst_output.analysis
    reasoning_chain: List[str] = [
        "Simulated only the actions returned by Agent 4; no real API calls were made."
    ]

    if not plan.should_escalate or not plan.actions:
        execution = SimulatedExecution(
            route_updates=[],
            alerts_sent=[],
            tickets_created=[],
            state_changes=[],
            system_status="no_escalation_monitoring",
        )
        reasoning_chain.append("No actions were simulated because Agent 4 generated no emergency plan.")
        return ExecutionSimulatorOutput(
            agent_name=AgentName.EXECUTION_SIMULATOR,
            execution=execution,
            reasoning_chain=reasoning_chain,
        )

    route_updates: List[str] = []
    alerts_sent: List[str] = []
    tickets_created: List[EmergencyTicket] = []
    state_changes: List[SimulationStateChange] = []

    for action in plan.actions:
        if action.action_type == ActionType.REROUTE_TRAFFIC:
            route_updates.append(f"Mock map route updated away from {action.target}.")
            before_speed, after_speed = _speed_change_for_target(scenario, action.target)
            state_changes.append(
                SimulationStateChange(
                    metric=f"traffic_speed_{action.target}",
                    before=_format_speed_value(before_speed),
                    after=_format_speed_value(after_speed),
                    unit="km/h",
                )
            )
        elif action.action_type == ActionType.SEND_ALERT:
            alerts_sent.append(f"Simulated public alert sent for {action.target}.")
            state_changes.append(
                SimulationStateChange(
                    metric="public_alerts_sent",
                    before="0",
                    after="1",
                    unit="count",
                )
            )
        elif action.action_type == ActionType.DISPATCH_EMERGENCY:
            assigned_depot = action.assigned_resource or plan.selected_depot or "G-6 Markaz Emergency Centre"
            tickets_created.append(
                EmergencyTicket(
                    ticket_id=f"ticket-{scenario.scenario_id}",
                    location=analysis.location,
                    crisis_type=analysis.crisis_type,
                    assigned_depot=assigned_depot,
                    priority=action.priority,
                    status=ActionStatus.SIMULATED,
                )
            )
            state_changes.append(
                SimulationStateChange(
                    metric="emergency_tickets_created",
                    before="0",
                    after="1",
                    unit="count",
                )
            )
        elif action.action_type == ActionType.OPEN_SHELTER:
            state_changes.append(
                SimulationStateChange(
                    metric=f"shelter_status_{action.target}",
                    before="standby",
                    after="prepared",
                    unit="status",
                )
            )

    execution = SimulatedExecution(
        route_updates=route_updates,
        alerts_sent=alerts_sent,
        tickets_created=tickets_created,
        state_changes=state_changes,
        system_status="simulated_response_complete",
    )

    reasoning_chain.extend(
        [
            f"Simulated {len(route_updates)} route update(s).",
            f"Simulated {len(alerts_sent)} public alert broadcast(s).",
            f"Created {len(tickets_created)} emergency ticket(s).",
            f"Recorded {len(state_changes)} before/after state change(s).",
        ]
    )

    return ExecutionSimulatorOutput(
        agent_name=AgentName.EXECUTION_SIMULATOR,
        execution=execution,
        reasoning_chain=reasoning_chain,
    )


def _speed_change_for_target(scenario: ScenarioInput, target: str) -> tuple[str, str]:
    target_lower = target.lower()
    for report in scenario.traffic:
        if target_lower in report.road_name.lower() or report.road_name.lower() in target_lower:
            after = min(report.normal_speed_kmh, max(report.speed_kmh + 12.0, report.normal_speed_kmh * 0.45))
            return str(round(report.speed_kmh, 1)), str(round(after, 1))

    blocked_reports = [report for report in scenario.traffic if report.speed_kmh <= 5.0]
    if blocked_reports:
        before = min(report.speed_kmh for report in blocked_reports)
        normal = max(report.normal_speed_kmh for report in blocked_reports)
        after = min(normal, max(before + 10.0, normal * 0.4))
        return str(round(before, 1)), str(round(after, 1))

    return "normal", "normal"


def _format_speed_value(value: str) -> str:
    try:
        float(value)
    except ValueError:
        return value
    return f"{value} km/h"
