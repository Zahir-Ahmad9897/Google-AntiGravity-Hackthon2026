from __future__ import annotations

import re
from typing import List, Tuple

from backend.schemas import (
    AgentName,
    CrisisType,
    ScenarioInput,
    SignalEvent,
    SignalWatcherOutput,
    SourceType,
)


LOCATION_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\bg[-\s]?10\b", re.IGNORECASE), "G-10"),
    (re.compile(r"\bg[-\s]?11\b", re.IGNORECASE), "G-11"),
    (re.compile(r"\bfaizabad\b", re.IGNORECASE), "Faizabad intersection"),
    (re.compile(r"\blehtrar\b", re.IGNORECASE), "Lehtrar Road"),
    (re.compile(r"\bring road\b", re.IGNORECASE), "Peshawar Ring Road"),
    (re.compile(r"\bpeshawar\b", re.IGNORECASE), "Peshawar Ring Road"),
    (re.compile(r"\buniversity road\b", re.IGNORECASE), "University Road diversion"),
    (re.compile(r"\bmargalla\b", re.IGNORECASE), "Margalla Road sector crossing"),
    (re.compile(r"\bkhayaban[-\s]e[-\s]iqbal\b", re.IGNORECASE), "Khayaban-e-Iqbal"),
]

FLOOD_TERMS = ("pani", "paani", "flood", "overflow", "nullah", "ghus", "bhar gaya")
ACCIDENT_TERMS = ("accident", "phari", "crash", "collision", "bada accident", "blast")
BLOCKAGE_TERMS = ("road block", "block hai", "queue", "avoid", "traffic", "jam", "sealed", "stuck", "phans")
HIGH_URGENCY_TERMS = ("urgent", "bohot zyada", "phase", "phans", "overflow", "wapas aajao", "ambulance")
WEAK_NON_CRISIS_TERMS = ("thodi baarish", "light rain", "baarish ho rahi")


def run_signal_watcher(scenario: ScenarioInput) -> SignalWatcherOutput:
    signals: List[SignalEvent] = []
    ignored_inputs: List[str] = []
    reasoning_chain: List[str] = [
        "Read simulated social, weather, and traffic inputs using the same schema expected from production collectors."
    ]

    for post in scenario.social_posts:
        crisis_type, urgency_score, confidence_hint, evidence = _classify_social_text(post.text)
        location = _extract_location(post.text)
        signals.append(
            SignalEvent(
                event_id=f"{post.post_id}-event",
                source_type=SourceType.SOCIAL,
                location=location,
                crisis_type=crisis_type,
                urgency_score=urgency_score,
                confidence_hint=confidence_hint,
                timestamp=post.timestamp,
                raw_text=post.text,
                evidence=evidence,
                metadata={
                    "platform": post.platform,
                    "language": post.language.value,
                    "reporter_hash": post.reporter_hash or "unknown",
                },
            )
        )
        reasoning_chain.append(
            f"Social post {post.post_id} mapped to {crisis_type.value} at {location} with urgency {urgency_score}/5."
        )

    weather = scenario.weather
    if weather.alert_active or weather.rainfall_mm_per_hour >= 5.0:
        crisis_type = (
            CrisisType.FLASH_FLOOD
            if "flash" in weather.alert_type.lower()
            else CrisisType.URBAN_FLOODING
        )
        signals.append(
            SignalEvent(
                event_id=f"{weather.report_id}-event",
                source_type=SourceType.WEATHER,
                location=weather.district,
                crisis_type=crisis_type,
                urgency_score=max(2, weather.alert_level),
                confidence_hint=0.8 if weather.alert_active else 0.55,
                timestamp=weather.timestamp,
                raw_text=(
                    f"{weather.alert_type}: rainfall {weather.rainfall_mm_per_hour}mm/hr, "
                    f"alert_active={weather.alert_active}"
                ),
                evidence=[
                    f"rainfall_mm_per_hour={weather.rainfall_mm_per_hour}",
                    f"alert_level={weather.alert_level}",
                ],
                metadata={
                    "district": weather.district,
                    "alert_active": weather.alert_active,
                    "alert_type": weather.alert_type,
                    "rainfall_mm_per_hour": weather.rainfall_mm_per_hour,
                },
            )
        )
        reasoning_chain.append(
            f"Weather report {weather.report_id} became a {crisis_type.value} signal because rainfall is "
            f"{weather.rainfall_mm_per_hour}mm/hr and alert_active={weather.alert_active}."
        )
    else:
        ignored_inputs.append(
            f"Weather {weather.report_id} ignored: rainfall {weather.rainfall_mm_per_hour}mm/hr and no active alert."
        )

    for traffic in scenario.traffic:
        if traffic.speed_kmh <= 5.0 or traffic.congestion_level >= 4:
            signals.append(
                SignalEvent(
                    event_id=f"{traffic.report_id}-event",
                    source_type=SourceType.TRAFFIC,
                    location=traffic.road_name,
                    crisis_type=CrisisType.ROAD_BLOCKAGE,
                    urgency_score=5 if traffic.speed_kmh <= 1.0 else 4,
                    confidence_hint=0.75,
                    timestamp=traffic.timestamp,
                    raw_text=(
                        f"{traffic.road_name}: speed {traffic.speed_kmh}km/h, "
                        f"normal {traffic.normal_speed_kmh}km/h"
                    ),
                    evidence=[
                        f"speed_kmh={traffic.speed_kmh}",
                        f"normal_speed_kmh={traffic.normal_speed_kmh}",
                        f"congestion_level={traffic.congestion_level}",
                    ],
                    metadata={
                        "road_name": traffic.road_name,
                        "speed_kmh": traffic.speed_kmh,
                        "normal_speed_kmh": traffic.normal_speed_kmh,
                        "congestion_level": traffic.congestion_level,
                    },
                )
            )
            reasoning_chain.append(
                f"Traffic report {traffic.report_id} became a road_blockage signal because speed is "
                f"{traffic.speed_kmh}km/h with congestion level {traffic.congestion_level}/5."
            )
        else:
            ignored_inputs.append(
                f"Traffic {traffic.report_id} ignored: speed {traffic.speed_kmh}km/h is near normal."
            )

    reasoning_chain.append(f"Agent 1 produced {len(signals)} structured SignalEvent objects.")

    return SignalWatcherOutput(
        agent_name=AgentName.SIGNAL_WATCHER,
        signals=signals,
        ignored_inputs=ignored_inputs,
        reasoning_chain=reasoning_chain,
    )


def _extract_location(text: str) -> str:
    for pattern, location in LOCATION_PATTERNS:
        if pattern.search(text):
            return location
    return "Islamabad"


def _classify_social_text(text: str) -> Tuple[CrisisType, int, float, List[str]]:
    lowered = text.lower()
    evidence: List[str] = []

    if any(term in lowered for term in WEAK_NON_CRISIS_TERMS) and not any(
        term in lowered for term in FLOOD_TERMS if term not in ("pani", "paani")
    ):
        return CrisisType.NO_CRISIS, 1, 0.2, ["weak rain language without damage, blockage, or rescue terms"]

    if any(term in lowered for term in ACCIDENT_TERMS):
        evidence.extend([term for term in ACCIDENT_TERMS if term in lowered])
        if any(term in lowered for term in BLOCKAGE_TERMS):
            evidence.extend([term for term in BLOCKAGE_TERMS if term in lowered])
        return CrisisType.ACCIDENT, 5 if "urgent" in lowered else 4, 0.7, evidence

    if "nullah" in lowered or "overflow" in lowered:
        evidence.extend([term for term in ("nullah", "overflow") if term in lowered])
        return CrisisType.FLASH_FLOOD, 5, 0.75, evidence

    if any(term in lowered for term in FLOOD_TERMS):
        evidence.extend([term for term in FLOOD_TERMS if term in lowered])
        urgency = 4 if any(term in lowered for term in HIGH_URGENCY_TERMS) else 3
        return CrisisType.URBAN_FLOODING, urgency, 0.7, evidence

    if any(term in lowered for term in BLOCKAGE_TERMS):
        evidence.extend([term for term in BLOCKAGE_TERMS if term in lowered])
        return CrisisType.ROAD_BLOCKAGE, 3, 0.55, evidence

    return CrisisType.NO_CRISIS, 1, 0.2, ["no strong crisis vocabulary detected"]
