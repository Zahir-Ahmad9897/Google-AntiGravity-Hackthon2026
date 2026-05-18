from __future__ import annotations

from typing import Any, Iterable

from backend.agents.execution_simulator import run_execution_simulator
from backend.agents.response_planner import run_response_planner
from backend.schemas import ScenarioInput, SignalEvent
from backend.services.artifacts import save_artifact


def get_weather_signal(location: str, scenario: ScenarioInput | None = None) -> dict[str, Any]:
    if scenario is None:
        return {
            "location": location,
            "source": "mock_weather",
            "rainfall_mm_per_hour": 0.0,
            "alert_active": False,
            "alert_level": 0,
            "note": "No scenario context supplied; returned neutral mock weather.",
        }

    weather = scenario.weather
    return {
        "location": location,
        "source": "mock_weather",
        "district": weather.district,
        "rainfall_mm_per_hour": weather.rainfall_mm_per_hour,
        "alert_active": weather.alert_active,
        "alert_type": weather.alert_type,
        "alert_level": weather.alert_level,
        "timestamp": weather.timestamp.isoformat(),
    }


def get_traffic_signal(location: str, scenario: ScenarioInput | None = None) -> list[dict[str, Any]]:
    if scenario is None:
        return [
            {
                "location": location,
                "source": "mock_traffic",
                "road_name": location,
                "speed_kmh": 30.0,
                "congestion_level": 1,
                "note": "No scenario context supplied; returned neutral mock traffic.",
            }
        ]

    return [
        {
            "location": location,
            "source": "mock_traffic",
            "road_name": report.road_name,
            "speed_kmh": report.speed_kmh,
            "normal_speed_kmh": report.normal_speed_kmh,
            "congestion_level": report.congestion_level,
            "timestamp": report.timestamp.isoformat(),
        }
        for report in scenario.traffic
    ]


def get_public_reports(location: str, scenario: ScenarioInput | None = None) -> list[dict[str, Any]]:
    if scenario is None:
        return []
    return [
        {
            "location": location,
            "source": "authorized_public_report",
            "post_id": post.post_id,
            "text": post.text,
            "language": post.language.value,
            "timestamp": post.timestamp.isoformat(),
        }
        for post in scenario.social_posts
    ]


def verify_signals(signals: Iterable[SignalEvent]) -> dict[str, Any]:
    signal_list = list(signals)
    seen: set[tuple[str, str, str]] = set()
    unique_signals: list[str] = []
    duplicates: list[str] = []
    noise: list[str] = []

    for signal in signal_list:
        key = (signal.source_type.value, signal.location.lower(), signal.crisis_type.value)
        if signal.crisis_type.value == "no_crisis":
            noise.append(signal.event_id)
            continue
        if key in seen:
            duplicates.append(signal.event_id)
            continue
        seen.add(key)
        unique_signals.append(signal.event_id)

    return {
        "total_signals": len(signal_list),
        "unique_crisis_signals": unique_signals,
        "duplicates_removed": duplicates,
        "noise_removed": noise,
        "verified_count": len(unique_signals),
    }


def calculate_risk_score(signals: Iterable[SignalEvent]) -> float:
    signal_list = list(signals)
    if not signal_list:
        return 0.0
    urgency_component = max(signal.urgency_score for signal in signal_list) / 5
    source_component = min(len({signal.source_type for signal in signal_list}) / 3, 1.0)
    confidence_component = max(signal.confidence_hint for signal in signal_list)
    risk = 0.45 * urgency_component + 0.25 * source_component + 0.3 * confidence_component
    return round(min(1.0, risk), 2)


def generate_rescue_plan(context: dict[str, Any]) -> dict[str, Any]:
    scenario = context["scenario"]
    analyst_output = context["analyst_output"]
    planner_output = run_response_planner(scenario, analyst_output)
    return planner_output.model_dump(mode="json")


def simulate_action(action_plan: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    scenario = context["scenario"]
    analyst_output = context["analyst_output"]
    planner_output = context["planner_output"]
    execution_output = run_execution_simulator(scenario, analyst_output, planner_output)
    return execution_output.model_dump(mode="json")


__all__ = [
    "calculate_risk_score",
    "generate_rescue_plan",
    "get_public_reports",
    "get_traffic_signal",
    "get_weather_signal",
    "save_artifact",
    "simulate_action",
    "verify_signals",
]
