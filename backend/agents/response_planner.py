from __future__ import annotations

from typing import List, Tuple

from backend.schemas import (
    ActionType,
    AgentName,
    CrisisType,
    EscalationLevel,
    ResponseAction,
    ResponsePlan,
    ResponsePlannerOutput,
    ScenarioInput,
    SituationAnalysis,
    SituationAnalystOutput,
)


EMERGENCY_DEPOTS = [
    "G-6 Markaz Emergency Centre",
    "F-8 Rescue Station",
    "H-8 Civil Defence Post",
    "I-10 Industrial Rescue Unit",
    "Golra Fire Station",
    "Peshawar Ring Road Simulation Depot",
]

FLOOD_PRONE_ROADS = [
    "Khayaban-e-Iqbal",
    "Lehtrar Road",
    "Srinagar Highway G-10 underpass",
    "Margalla Road sector crossing",
    "Faizabad intersection",
    "Peshawar Ring Road",
    "University Road diversion",
]

SHELTERS = [
    "G-10 Community Centre",
    "F-7 Jinnah Sports Complex",
    "H-9 Livestock Ground",
    "I-8 Markaz Parking Structure",
    "PWD Colony Open Ground",
]


def run_response_planner(
    scenario: ScenarioInput,
    analyst_output: SituationAnalystOutput,
) -> ResponsePlannerOutput:
    analysis = analyst_output.analysis
    reasoning_chain: List[str] = [
        "Examined escalation level, crisis type, affected roads, and approved resource lists."
    ]

    if analysis.escalation != EscalationLevel.CRISIS:
        plan = ResponsePlan(
            should_escalate=False,
            selected_depot=None,
            selected_shelter=None,
            alternate_routes=[],
            actions=[],
            limitations=[
                "No emergency plan generated because evidence did not reach crisis escalation threshold."
            ],
        )
        reasoning_chain.append(
            f"Escalation is {analysis.escalation.value}, so Agent 4 generated no action plan."
        )
        return ResponsePlannerOutput(
            agent_name=AgentName.RESPONSE_PLANNER,
            plan=plan,
            reasoning_chain=reasoning_chain,
        )

    depot = _select_depot(analysis.location, analysis.crisis_type)
    shelter = _select_shelter(analysis.location, analysis.crisis_type)
    approved_roads, limitations = _approved_road_targets(analysis.affected_roads, analysis.location)
    alternate_routes = [road for road in FLOOD_PRONE_ROADS if road not in approved_roads][:2]
    actions = _build_actions(analysis, depot, shelter, approved_roads)

    plan = ResponsePlan(
        should_escalate=True,
        selected_depot=depot,
        selected_shelter=shelter,
        alternate_routes=alternate_routes,
        actions=actions,
        limitations=limitations,
    )

    reasoning_chain.extend(
        [
            f"Selected depot: {depot}.",
            f"Selected shelter: {shelter or 'none required'}.",
            f"Approved road targets: {', '.join(approved_roads) if approved_roads else 'none'}.",
            f"Generated {len(actions)} coordinated response action(s).",
        ]
    )
    if limitations:
        reasoning_chain.append("Limitations: " + " ".join(limitations))

    return ResponsePlannerOutput(
        agent_name=AgentName.RESPONSE_PLANNER,
        plan=plan,
        reasoning_chain=reasoning_chain,
    )


def _select_depot(location: str, crisis_type: CrisisType) -> str:
    if "Peshawar" in location or "Ring Road" in location:
        return "Peshawar Ring Road Simulation Depot"
    if "Faizabad" in location:
        return "H-8 Civil Defence Post"
    if "Lehtrar" in location:
        return "I-10 Industrial Rescue Unit"
    if "G-11" in location:
        return "Golra Fire Station"
    if crisis_type == CrisisType.ACCIDENT:
        return "F-8 Rescue Station"
    return "G-6 Markaz Emergency Centre"


def _select_shelter(location: str, crisis_type: CrisisType) -> str | None:
    if crisis_type not in (CrisisType.URBAN_FLOODING, CrisisType.FLASH_FLOOD):
        return None
    if "G-10" in location or "G-11" in location:
        return "G-10 Community Centre"
    if "Lehtrar" in location:
        return "PWD Colony Open Ground"
    if "Faizabad" in location:
        return "I-8 Markaz Parking Structure"
    return "H-9 Livestock Ground"


def _approved_road_targets(affected_roads: List[str], location: str) -> Tuple[List[str], List[str]]:
    approved: List[str] = []
    limitations: List[str] = []

    for road in affected_roads:
        if road in FLOOD_PRONE_ROADS:
            approved.append(road)
        else:
            closest = _closest_approved_road(road, location)
            approved.append(closest)
            limitations.append(
                f"{road} is outside the approved demo road list, so closest listed target {closest} was selected."
            )

    if not approved:
        closest = _closest_approved_road("", location)
        approved.append(closest)
        limitations.append(
            f"No affected road matched the approved list, so closest listed target {closest} was selected."
        )

    return list(dict.fromkeys(approved)), limitations


def _closest_approved_road(road: str, location: str) -> str:
    combined = f"{road} {location}".lower()
    if "peshawar" in combined or "ring road" in combined:
        return "Peshawar Ring Road"
    if "university road" in combined:
        return "University Road diversion"
    if "faizabad" in combined or "murree" in combined:
        return "Faizabad intersection"
    if "lehtrar" in combined:
        return "Lehtrar Road"
    if "margalla" in combined:
        return "Margalla Road sector crossing"
    if "g-11" in combined or "g11" in combined or "g-10" in combined or "g10" in combined:
        return "Srinagar Highway G-10 underpass"
    return "Khayaban-e-Iqbal"


def _build_actions(analysis: "SituationAnalysis", depot: str, shelter: str | None, approved_roads: List[str]) -> List[ResponseAction]:
    actions = [
        ResponseAction(
            action_id="action-1-dispatch",
            action_type=ActionType.DISPATCH_EMERGENCY,
            description=f"Dispatch response unit from {depot} to {analysis.location}.",
            target=analysis.location,
            priority=max(1, analysis.severity_score),
            assigned_resource=depot,
        ),
        ResponseAction(
            action_id="action-2-alert",
            action_type=ActionType.SEND_ALERT,
            description=f"Send public alert for {analysis.detected_situation}.",
            target=analysis.location,
            priority=max(1, analysis.severity_score - 1),
            assigned_resource=None,
        ),
    ]

    for index, road in enumerate(approved_roads, start=1):
        actions.append(
            ResponseAction(
                action_id=f"action-3-reroute-{index}",
                action_type=ActionType.REROUTE_TRAFFIC,
                description=f"Update mock map routing away from {road}.",
                target=road,
                priority=max(1, analysis.severity_score - 1),
                assigned_resource=None,
            )
        )

    if shelter is not None and analysis.severity_score >= 4:
        actions.append(
            ResponseAction(
                action_id="action-4-shelter",
                action_type=ActionType.OPEN_SHELTER,
                description=f"Prepare intake capacity at {shelter}.",
                target=shelter,
                priority=analysis.severity_score,
                assigned_resource=shelter,
            )
        )

    return actions
