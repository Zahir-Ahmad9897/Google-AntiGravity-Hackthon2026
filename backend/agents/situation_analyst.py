from __future__ import annotations

from typing import List

from backend.schemas import (
    AgentName,
    ConfidenceBand,
    ConfidenceBreakdown,
    CrisisDetectorOutput,
    CrisisType,
    EscalationLevel,
    ScenarioInput,
    SignalEvent,
    SituationAnalysis,
    SituationAnalystOutput,
)


POPULATION_DENSITY = {
    "G-10": 8400,
    "G-11": 7900,
    "Faizabad intersection": 6200,
    "Lehtrar Road": 3200,
    "Khayaban-e-Iqbal": 7600,
    "Margalla Road sector crossing": 7000,
    "Peshawar Ring Road": 6800,
    "University Road diversion": 7200,
    "Srinagar Highway G-10 underpass": 8100,
    "Islamabad": 5400,
}


def run_situation_analyst(
    scenario: ScenarioInput,
    detector_output: CrisisDetectorOutput,
) -> SituationAnalystOutput:
    cluster = detector_output.selected_cluster

    if cluster is None:
        analysis = SituationAnalysis(
            detected_situation="No confirmed crisis",
            location="Islamabad",
            crisis_type=CrisisType.NO_CRISIS,
            severity_score=0,
            confidence=_empty_confidence_from_detector(detector_output),
            confidence_band=ConfidenceBand.LOW,
            escalation=EscalationLevel.NO_ESCALATION,
            affected_roads=[],
            affected_population_density_per_sq_km=POPULATION_DENSITY["Islamabad"],
            primary_risks=[],
            secondary_risks=[],
            reasoning_chain=["No cluster was selected, so Agent 3 did not infer a crisis."],
        )
        return SituationAnalystOutput(
            agent_name=AgentName.SITUATION_ANALYST,
            analysis=analysis,
            reasoning_chain=analysis.reasoning_chain,
        )

    affected_roads = _affected_roads(scenario)
    population_density = _population_density(cluster.location)
    severity_score = _severity_score(scenario, cluster.crisis_type, cluster.escalation)
    primary_risks = _primary_risks(cluster.crisis_type, affected_roads)
    secondary_risks = _secondary_risks(cluster.location, cluster.crisis_type)
    detected_situation = _detected_situation(cluster.crisis_type, cluster.location)

    weather_line = (
        f"active rainfall alert level {scenario.weather.alert_level} confirmed from simulated PMD API"
        if scenario.weather.alert_active
        else "no active weather alert confirmed from simulated PMD API"
    )
    traffic_line = _traffic_reasoning_line(scenario)
    confidence = cluster.confidence
    reasoning_chain = [
        (
            f"Signal count is {confidence.correlated_signal_count} correlated crisis signal(s) "
            f"from {len(cluster.signals)} total observed signal(s) within {cluster.location} "
            f"over {cluster.time_window_minutes} minutes."
        ),
        (
            f"Weather evidence: {weather_line}; rainfall is "
            f"{scenario.weather.rainfall_mm_per_hour}mm per hour."
        ),
        traffic_line,
        (
            f"Residential population density for {cluster.location} is estimated at "
            f"{population_density} per square kilometre."
        ),
        (
            f"Severity logic: severity score is {severity_score} of 5 because "
            f"crisis_type={cluster.crisis_type.value}, escalation={cluster.escalation.value}, "
            f"weather_alert={scenario.weather.alert_active}, affected_roads={len(affected_roads)}, "
            f"and max_urgency={_max_urgency(cluster.signals)}."
        ),
        (
            f"Confidence formula: {confidence.base_confidence} base + "
            f"{confidence.correlated_signal_addition} signal addition "
            f"(min(0.1 * {confidence.correlated_signal_count}, 0.4)) + "
            f"{confidence.weather_alert_addition} weather-alert addition - "
            f"{confidence.stale_signal_penalty} stale-signal penalty - "
            f"{confidence.single_source_penalty} single-source penalty = "
            f"{confidence.raw_score_before_bounds}, bounded to final score {confidence.final_score}."
        ),
        f"Primary risks: {'; '.join(primary_risks) if primary_risks else 'none'}",
        f"Secondary risks: {'; '.join(secondary_risks) if secondary_risks else 'none'}",
        _system_state_reasoning_line(cluster.escalation),
    ]

    analysis = SituationAnalysis(
        detected_situation=detected_situation,
        location=cluster.location,
        crisis_type=cluster.crisis_type,
        severity_score=severity_score,
        confidence=confidence,
        confidence_band=cluster.confidence_band,
        escalation=cluster.escalation,
        affected_roads=affected_roads,
        affected_population_density_per_sq_km=population_density,
        primary_risks=primary_risks,
        secondary_risks=secondary_risks,
        reasoning_chain=reasoning_chain,
    )

    return SituationAnalystOutput(
        agent_name=AgentName.SITUATION_ANALYST,
        analysis=analysis,
        reasoning_chain=reasoning_chain,
    )


def _empty_confidence_from_detector(detector_output: CrisisDetectorOutput) -> ConfidenceBreakdown:
    if detector_output.clusters:
        return detector_output.clusters[0].confidence
    return ConfidenceBreakdown(
        formula_text="No cluster available; default baseline confidence used.",
        base_confidence=0.5,
        correlated_signal_count=0,
        source_type_count=0,
        correlated_signal_addition=0.0,
        weather_alert_addition=0.0,
        stale_signal_penalty=0.0,
        single_source_penalty=0.1,
        raw_score_before_bounds=0.4,
        final_score=0.4,
    )


def _affected_roads(scenario: ScenarioInput) -> List[str]:
    return [
        traffic.road_name
        for traffic in scenario.traffic
        if traffic.speed_kmh <= 5.0 or traffic.congestion_level >= 4
    ]


def _population_density(location: str) -> int:
    return POPULATION_DENSITY.get(location, POPULATION_DENSITY["Islamabad"])


def _severity_score(
    scenario: ScenarioInput,
    crisis_type: CrisisType,
    escalation: EscalationLevel,
) -> int:
    if escalation == EscalationLevel.NO_ESCALATION or crisis_type == CrisisType.NO_CRISIS:
        return 1
    if crisis_type == CrisisType.FLASH_FLOOD:
        return 5 if scenario.weather.rainfall_mm_per_hour >= 10.0 else 4
    if crisis_type == CrisisType.URBAN_FLOODING:
        return 4
    if crisis_type == CrisisType.ACCIDENT:
        return 4 if any(report.speed_kmh <= 2.0 for report in scenario.traffic) else 3
    if crisis_type == CrisisType.ROAD_BLOCKAGE:
        return 3
    return 3


def _primary_risks(crisis_type: CrisisType, affected_roads: List[str]) -> List[str]:
    if crisis_type == CrisisType.NO_CRISIS:
        return []
    if crisis_type in (CrisisType.URBAN_FLOODING, CrisisType.FLASH_FLOOD):
        risks = ["vehicle entrapment", "infrastructure damage from standing floodwater"]
        if affected_roads:
            risks.append(f"traffic immobilisation on {', '.join(affected_roads)}")
        return risks
    if crisis_type == CrisisType.ACCIDENT:
        return ["injury risk at crash site", "secondary collisions from queue buildup"]
    if crisis_type == CrisisType.ROAD_BLOCKAGE:
        return ["blocked commuter flow", "delayed emergency access"]
    return ["localized infrastructure disruption"]


def _secondary_risks(location: str, crisis_type: CrisisType) -> List[str]:
    if crisis_type == CrisisType.NO_CRISIS:
        return []
    if crisis_type in (CrisisType.URBAN_FLOODING, CrisisType.FLASH_FLOOD):
        return [
            f"displacement pressure for low-income residents near {location}",
            "delayed rescue access if congestion is not reduced",
        ]
    if crisis_type == CrisisType.ACCIDENT:
        return ["spillover congestion into adjacent approaches", "ambulance access delay"]
    return ["public confusion without clear rerouting alerts"]


def _detected_situation(crisis_type: CrisisType, location: str) -> str:
    labels = {
        CrisisType.URBAN_FLOODING: "Urban flooding",
        CrisisType.FLASH_FLOOD: "Flash flood warning",
        CrisisType.ACCIDENT: "Major accident and road blockage",
        CrisisType.ROAD_BLOCKAGE: "Road blockage",
        CrisisType.INFRASTRUCTURE_FAILURE: "Infrastructure failure",
        CrisisType.NO_CRISIS: "No confirmed crisis",
    }
    return f"{labels[crisis_type]} detected in {location}"


def _max_urgency(signals: list[SignalEvent]) -> int:
    return max((signal.urgency_score for signal in signals), default=0)


def _traffic_reasoning_line(scenario: ScenarioInput) -> str:
    blocked_reports = [
        (
            f"{report.road_name} speed {report.speed_kmh}km/h versus normal "
            f"{report.normal_speed_kmh}km/h, congestion {report.congestion_level}/5"
        )
        for report in scenario.traffic
        if report.speed_kmh <= 5.0 or report.congestion_level >= 4
    ]
    if not blocked_reports:
        return "Traffic evidence: all simulated traffic reports are near normal speed."
    return "Traffic evidence: " + "; ".join(blocked_reports) + "."


def _system_state_reasoning_line(escalation: EscalationLevel) -> str:
    if escalation == EscalationLevel.NO_ESCALATION:
        return "Escalation decision remains no_escalation; system state is passive monitoring."
    if escalation == EscalationLevel.WATCHLIST:
        return "Escalation decision remains watchlist; system state is watchlist monitoring."
    return "Escalation decision remains crisis; system state is crisis active."
