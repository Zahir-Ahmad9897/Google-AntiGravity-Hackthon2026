from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

from backend.iterative_schemas import IterativeScenarioDefinition, IterativeScenarioStep
from backend.schemas import LanguageLabel, ScenarioInput, SocialPost, TrafficReport, WeatherReport


CRISIS_TERMS = {
    "urban_flooding": ("flood", "pani", "paani", "rain", "overflow", "nullah", "water", "flooding"),
    "road_blockage": ("road block", "blocked", "block hai", "traffic", "jam", "sealed", "stuck", "congestion", "avoid"),
    "accident": ("blast", "accident", "crash", "collision", "injured", "ambulance"),
}

URGENCY_TERMS = ("urgent", "critical", "help", "ambulance", "stuck", "phans", "phase", "sealed", "overflow", "blast")
URDU_HINTS = ("hai", "hain", "mein", "ke", "pani", "paani", "bohot", "zyada", "qareeb", "rasta")

ROAD_PATTERNS = (
    r"Srinagar Highway",
    r"Ring Road",
    r"University Road",
    r"Margalla Road",
    r"Khayaban-e-Iqbal",
    r"Lehtrar Road",
    r"Faizabad",
    r"G[-\s]?\d+\s*(?:Markaz|Islamabad)?",
)

TIME_PATTERN = re.compile(
    r"\b(?:now|today|tonight|morning|evening|urgent|immediately|\d{1,2}:\d{2}|\d+\s*(?:min|mins|minutes|hours?))\b",
    re.IGNORECASE,
)


def extract_crisis_signal(
    text: str,
    source: str,
    location: str,
    permission_granted: bool,
) -> dict[str, Any]:
    clean_text = text.strip()
    clean_location = location.strip() or "Unknown"

    if not permission_granted:
        return {
            "is_crisis_related": False,
            "crisis_type": "no_crisis",
            "location": clean_location,
            "urgency": "none",
            "confidence": 0.0,
            "language_detected": "unknown",
            "entities": _empty_entities(),
            "reasoning_summary": "Permission was not granted, so CIRO did not analyze the text.",
            "privacy_status": "permission_required",
            "source": source,
        }

    if not clean_text:
        return {
            "is_crisis_related": False,
            "crisis_type": "no_crisis",
            "location": clean_location,
            "urgency": "none",
            "confidence": 0.0,
            "language_detected": "unknown",
            "entities": _empty_entities(),
            "reasoning_summary": "No text was supplied for approved analysis.",
            "privacy_status": "user_approved_input_only",
            "source": source,
        }

    lowered = clean_text.lower()
    crisis_type, matched_terms = _classify_crisis(lowered)
    entities = _extract_entities(clean_text, matched_terms)
    urgency = _urgency(lowered, matched_terms)
    confidence = _confidence(matched_terms, entities, bool(location.strip()))
    is_crisis_related = crisis_type != "no_crisis" and confidence >= 0.35

    return {
        "is_crisis_related": is_crisis_related,
        "crisis_type": crisis_type if is_crisis_related else "no_crisis",
        "location": clean_location,
        "urgency": urgency if is_crisis_related else "none",
        "confidence": confidence if is_crisis_related else min(confidence, 0.3),
        "language_detected": _detect_language(lowered),
        "entities": entities,
        "reasoning_summary": _reasoning_summary(is_crisis_related, crisis_type, matched_terms),
        "privacy_status": "user_approved_input_only",
        "source": source,
    }


def build_custom_iterative_scenario(
    signal: dict[str, Any],
    text: str,
    source: str,
    severity: str,
) -> IterativeScenarioDefinition:
    if not signal.get("is_crisis_related"):
        raise ValueError("No emergency signal detected; custom pipeline was not started.")

    now = datetime.now(timezone.utc)
    normalized_severity = _normalize_severity(severity, signal.get("urgency", "medium"))
    location = str(signal.get("location") or "Islamabad")
    road = _primary_road(signal, location)
    rainfall = _rainfall(normalized_severity, signal["crisis_type"])
    alert_level = _alert_level(normalized_severity)
    speed = _speed(normalized_severity)
    congestion = _congestion(normalized_severity)
    expected_escalation = normalized_severity in {"high", "critical"}

    steps = [
        _custom_step(
            1,
            "Approved custom report received; CIRO begins verification.",
            text,
            source,
            location,
            road,
            max(0.0, rainfall * 0.55),
            max(0, alert_level - 1),
            max(speed + 8.0, 8.0),
            max(1, congestion - 1),
            expected_escalation=False,
            timestamp=now - timedelta(minutes=8),
        ),
        _custom_step(
            2,
            "Custom signal correlated with weather and traffic simulation.",
            text,
            source,
            location,
            road,
            rainfall,
            alert_level,
            speed,
            congestion,
            expected_escalation=expected_escalation,
            timestamp=now - timedelta(minutes=4),
        ),
        _custom_step(
            3,
            "Simulation applies route update and evaluates remaining risk.",
            text,
            source,
            location,
            road,
            max(0.0, rainfall * 0.7),
            alert_level,
            min(max(speed + 10.0, 4.0), 28.0),
            max(1, congestion - 1),
            expected_escalation=expected_escalation,
            timestamp=now - timedelta(minutes=1),
        ),
    ]

    return IterativeScenarioDefinition(
        scenario_id="custom_permission_input",
        title=f"Custom approved crisis signal - {location}",
        description="User-approved custom crisis content routed through the existing CIRO iterative pipeline.",
        steps=steps,
    )


def _custom_step(
    iteration_number: int,
    update_note: str,
    text: str,
    source: str,
    location: str,
    road: str,
    rainfall: float,
    alert_level: int,
    speed: float,
    congestion: int,
    expected_escalation: bool,
    timestamp: datetime,
) -> IterativeScenarioStep:
    scenario = ScenarioInput(
        scenario_id="custom_permission_input",
        title=f"Custom approved crisis signal - {location}",
        description="Permission-based custom crisis report.",
        social_posts=[
            SocialPost(
                post_id=f"custom-i{iteration_number}-approved-1",
                text=text,
                platform=_normalize_source(source),
                timestamp=timestamp,
                language=LanguageLabel.MIXED,
                reporter_hash="custom_user_approved",
            )
        ],
        weather=WeatherReport(
            report_id=f"custom-i{iteration_number}-weather",
            district=location,
            rainfall_mm_per_hour=round(rainfall, 1),
            alert_active=alert_level >= 2,
            alert_type="custom_weather_context",
            alert_level=alert_level,
            timestamp=timestamp,
        ),
        traffic=[
            TrafficReport(
                report_id=f"custom-i{iteration_number}-traffic",
                road_name=road,
                speed_kmh=round(speed, 1),
                normal_speed_kmh=40.0,
                congestion_level=congestion,
                timestamp=timestamp,
            )
        ],
        expected_escalation=expected_escalation,
    )
    return IterativeScenarioStep(
        iteration_number=iteration_number,
        update_note=update_note,
        scenario=scenario,
        approved_context=["User explicitly approved this pasted content for emergency signal analysis."],
        permission_granted=True,
    )


def _classify_crisis(lowered: str) -> tuple[str, list[str]]:
    scores: dict[str, list[str]] = {}
    for crisis_type, terms in CRISIS_TERMS.items():
        matches = [term for term in terms if term in lowered]
        if matches:
            scores[crisis_type] = matches
    if not scores:
        return "no_crisis", []
    crisis_type = max(scores, key=lambda key: len(scores[key]))
    return crisis_type, scores[crisis_type]


def _extract_entities(text: str, hazards: list[str]) -> dict[str, list[str]]:
    roads: list[str] = []
    for pattern in ROAD_PATTERNS:
        roads.extend(match.group(0) for match in re.finditer(pattern, text, re.IGNORECASE))
    areas = list(dict.fromkeys(roads))
    time_mentions = [match.group(0) for match in TIME_PATTERN.finditer(text)]
    return {
        "roads": list(dict.fromkeys(roads)),
        "areas": areas,
        "hazards": list(dict.fromkeys(hazards)),
        "time_mentions": list(dict.fromkeys(time_mentions)),
    }


def _empty_entities() -> dict[str, list[str]]:
    return {"roads": [], "areas": [], "hazards": [], "time_mentions": []}


def _urgency(lowered: str, matched_terms: list[str]) -> str:
    if "blast" in lowered or "critical" in lowered or "ambulance" in lowered:
        return "critical"
    if len(matched_terms) >= 3 or any(term in lowered for term in URGENCY_TERMS):
        return "high"
    if len(matched_terms) >= 2:
        return "medium"
    return "low"


def _confidence(matched_terms: list[str], entities: dict[str, list[str]], has_location: bool) -> float:
    score = 0.18 + min(0.42, len(matched_terms) * 0.12)
    if entities["roads"] or entities["areas"]:
        score += 0.18
    if has_location:
        score += 0.17
    if entities["time_mentions"]:
        score += 0.05
    return round(min(0.92, score), 2)


def _detect_language(lowered: str) -> str:
    has_urdu = any(term in lowered for term in URDU_HINTS)
    has_ascii_words = bool(re.search(r"[a-z]{3,}", lowered))
    if has_urdu and has_ascii_words:
        return "mixed"
    if has_urdu:
        return "urdu"
    if has_ascii_words:
        return "english"
    return "unknown"


def _reasoning_summary(is_crisis_related: bool, crisis_type: str, matched_terms: list[str]) -> str:
    if not is_crisis_related:
        return "No emergency signal detected from the approved text."
    terms = ", ".join(matched_terms[:5])
    return f"Detected {crisis_type} indicators from approved text using terms: {terms}."


def _normalize_source(source: str) -> str:
    value = source.strip().lower().replace(" ", "_")
    return value or "user_approved_input"


def _normalize_severity(severity: str, urgency: str) -> str:
    value = (severity or urgency or "medium").strip().lower()
    if value in {"low", "medium", "high", "critical"}:
        return value
    return "medium"


def _primary_road(signal: dict[str, Any], location: str) -> str:
    roads = signal.get("entities", {}).get("roads", [])
    if roads:
        return str(roads[0])
    return location


def _rainfall(severity: str, crisis_type: str) -> float:
    if crisis_type not in {"urban_flooding", "road_blockage"}:
        return 0.0
    return {"low": 1.5, "medium": 4.8, "high": 8.8, "critical": 11.5}[severity]


def _alert_level(severity: str) -> int:
    return {"low": 0, "medium": 1, "high": 3, "critical": 4}[severity]


def _speed(severity: str) -> float:
    return {"low": 24.0, "medium": 14.0, "high": 3.0, "critical": 0.0}[severity]


def _congestion(severity: str) -> int:
    return {"low": 2, "medium": 3, "high": 5, "critical": 5}[severity]
