from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import List

from backend.schemas import (
    AgentName,
    ConfidenceBand,
    CrisisCluster,
    CrisisDetectorOutput,
    CrisisType,
    EscalationLevel,
    ScenarioInput,
    SignalEvent,
    SignalWatcherOutput,
    SourceType,
)
from backend.services.confidence import calculate_confidence, confidence_band, escalation_level


CRISIS_PRIORITY = [
    CrisisType.FLASH_FLOOD,
    CrisisType.URBAN_FLOODING,
    CrisisType.ACCIDENT,
    CrisisType.ROAD_BLOCKAGE,
    CrisisType.INFRASTRUCTURE_FAILURE,
]


def run_crisis_detector(
    scenario: ScenarioInput,
    watcher_output: SignalWatcherOutput,
) -> CrisisDetectorOutput:
    reasoning_chain: List[str] = [
        "Examined SignalEvent objects for crisis vocabulary, source diversity, and time-window correlation."
    ]
    crisis_signals = [
        signal for signal in watcher_output.signals if signal.crisis_type != CrisisType.NO_CRISIS
    ]
    cluster_signals = crisis_signals if crisis_signals else watcher_output.signals

    if not cluster_signals:
        reasoning_chain.append("No signals were available, so no cluster was created.")
        return CrisisDetectorOutput(
            agent_name=AgentName.CRISIS_DETECTOR,
            clusters=[],
            selected_cluster=None,
            reasoning_chain=reasoning_chain,
        )

    reference_time = _latest_scenario_timestamp(scenario)
    confidence = calculate_confidence(
        cluster_signals,
        weather_alert_active=scenario.weather.alert_active,
        reference_time=reference_time,
    )
    band = confidence_band(confidence.final_score)
    selected_crisis_type = _select_crisis_type(cluster_signals)
    escalation = (
        EscalationLevel.NO_ESCALATION
        if selected_crisis_type == CrisisType.NO_CRISIS
        else escalation_level(
            confidence.final_score,
            confidence.source_type_count,
            confidence.correlated_signal_count,
        )
    )
    source_types = sorted({signal.source_type for signal in cluster_signals}, key=lambda value: value.value)
    time_window_minutes = _time_window_minutes(cluster_signals)
    location = _select_location(cluster_signals)

    cluster = CrisisCluster(
        cluster_id=f"{scenario.scenario_id}-cluster-1",
        location=location,
        crisis_type=selected_crisis_type,
        signals=cluster_signals,
        source_types=source_types,
        time_window_minutes=time_window_minutes,
        confidence=confidence,
        confidence_band=band,
        escalation=escalation,
        evidence=_collect_evidence(cluster_signals),
    )

    reasoning_chain.extend(
        [
            f"Cluster contains {len(cluster_signals)} total signals and "
            f"{confidence.correlated_signal_count} correlated crisis signals.",
            f"Source diversity is {confidence.source_type_count} source type(s): "
            f"{', '.join(source.value for source in source_types) or 'none'}.",
            f"Confidence math: 0.5 base + {confidence.correlated_signal_addition} signal addition "
            f"+ {confidence.weather_alert_addition} weather alert addition - "
            f"{confidence.stale_signal_penalty} stale penalty - "
            f"{confidence.single_source_penalty} single-source penalty = {confidence.final_score}.",
            f"Escalation decision is {escalation.value} with confidence band {band.value}.",
        ]
    )

    return CrisisDetectorOutput(
        agent_name=AgentName.CRISIS_DETECTOR,
        clusters=[cluster],
        selected_cluster=cluster,
        reasoning_chain=reasoning_chain,
    )


def _select_crisis_type(signals: List[SignalEvent]) -> CrisisType:
    crisis_types = [signal.crisis_type for signal in signals if signal.crisis_type != CrisisType.NO_CRISIS]
    if not crisis_types:
        return CrisisType.NO_CRISIS

    counts = Counter(crisis_types)
    for crisis_type in CRISIS_PRIORITY:
        if counts[crisis_type] > 0:
            return crisis_type
    return crisis_types[0]


def _select_location(signals: List[SignalEvent]) -> str:
    social_locations = [
        signal.location
        for signal in signals
        if signal.source_type == SourceType.SOCIAL and signal.location != "Islamabad"
    ]
    if social_locations:
        return social_locations[0]

    non_weather_locations = [
        signal.location for signal in signals if signal.source_type != SourceType.WEATHER
    ]
    if non_weather_locations:
        return non_weather_locations[0]

    return signals[0].location


def _time_window_minutes(signals: List[SignalEvent]) -> float:
    timestamps = [signal.timestamp for signal in signals]
    if len(timestamps) < 2:
        return 0.0
    return round((max(timestamps) - min(timestamps)).total_seconds() / 60, 2)


def _collect_evidence(signals: List[SignalEvent]) -> List[str]:
    evidence: List[str] = []
    for signal in signals:
        evidence.extend(signal.evidence)
    return evidence


def _latest_scenario_timestamp(scenario: ScenarioInput) -> datetime:
    timestamps = [scenario.weather.timestamp]
    timestamps.extend(post.timestamp for post in scenario.social_posts)
    timestamps.extend(report.timestamp for report in scenario.traffic)
    return max(timestamps)
