from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict, List

from backend.schemas import LanguageLabel, ScenarioInput, SocialPost, TrafficReport, WeatherReport


def _now(reference_time: datetime | None = None) -> datetime:
    return reference_time or datetime.now(timezone.utc)


def build_scenarios(reference_time: datetime | None = None) -> Dict[str, ScenarioInput]:
    now = _now(reference_time)

    scenarios = [
        ScenarioInput(
            scenario_id="scenario_1",
            title="G-10 Urban Flooding",
            description="Correlated social, rainfall, and traffic evidence for urban flooding near G-10.",
            social_posts=[
                SocialPost(
                    post_id="s1-social-1",
                    text=(
                        "bhai G10 mein pani aa gaya yar bohot zyada hai garien phase ho gayi hain "
                        "please margalla road avoid karo"
                    ),
                    timestamp=now - timedelta(minutes=4),
                    language=LanguageLabel.URDU_ROMAN,
                    reporter_hash="user_a1",
                )
            ],
            weather=WeatherReport(
                report_id="s1-weather-1",
                district="Islamabad",
                rainfall_mm_per_hour=8.4,
                alert_active=True,
                alert_type="flood_alert",
                alert_level=3,
                timestamp=now - timedelta(minutes=2),
            ),
            traffic=[
                TrafficReport(
                    report_id="s1-traffic-1",
                    road_name="Khayaban-e-Iqbal",
                    speed_kmh=0.0,
                    normal_speed_kmh=38.0,
                    congestion_level=5,
                    timestamp=now - timedelta(minutes=3),
                ),
                TrafficReport(
                    report_id="s1-traffic-2",
                    road_name="Margalla Road sector crossing",
                    speed_kmh=4.0,
                    normal_speed_kmh=35.0,
                    congestion_level=4,
                    timestamp=now - timedelta(minutes=3),
                ),
            ],
            expected_escalation=True,
        ),
        ScenarioInput(
            scenario_id="scenario_2",
            title="Faizabad Accident and Blockage",
            description="No weather alert, but social and traffic evidence indicate a major accident blockage.",
            social_posts=[
                SocialPost(
                    post_id="s2-social-1",
                    text="URGENT faizabad pe bada accident hua hai 2 garien phari hain road block hai dono taraf queue",
                    timestamp=now - timedelta(minutes=5),
                    language=LanguageLabel.MIXED,
                    reporter_hash="user_b1",
                )
            ],
            weather=WeatherReport(
                report_id="s2-weather-1",
                district="Islamabad",
                rainfall_mm_per_hour=0.0,
                alert_active=False,
                alert_type="none",
                alert_level=0,
                timestamp=now - timedelta(minutes=1),
            ),
            traffic=[
                TrafficReport(
                    report_id="s2-traffic-1",
                    road_name="Faizabad intersection",
                    speed_kmh=0.0,
                    normal_speed_kmh=32.0,
                    congestion_level=5,
                    timestamp=now - timedelta(minutes=4),
                ),
                TrafficReport(
                    report_id="s2-traffic-2",
                    road_name="Murree Road approaching Faizabad",
                    speed_kmh=2.0,
                    normal_speed_kmh=30.0,
                    congestion_level=5,
                    timestamp=now - timedelta(minutes=4),
                ),
            ],
            expected_escalation=True,
        ),
        ScenarioInput(
            scenario_id="scenario_3",
            title="Flash Flood Warning Lehtrar Road",
            description="Heavy rainfall, overflow language, and zero traffic movement support a flash flood warning.",
            social_posts=[
                SocialPost(
                    post_id="s3-social-1",
                    text="Lehtrar road walon ko bata dain paani upar se aa raha hai nullah overflow ho gaya wapas aajao",
                    timestamp=now - timedelta(minutes=6),
                    language=LanguageLabel.URDU_ROMAN,
                    reporter_hash="user_c1",
                )
            ],
            weather=WeatherReport(
                report_id="s3-weather-1",
                district="Islamabad",
                rainfall_mm_per_hour=12.1,
                alert_active=True,
                alert_type="flash_flood_warning",
                alert_level=4,
                timestamp=now - timedelta(minutes=2),
            ),
            traffic=[
                TrafficReport(
                    report_id="s3-traffic-1",
                    road_name="Lehtrar Road",
                    speed_kmh=0.0,
                    normal_speed_kmh=34.0,
                    congestion_level=5,
                    timestamp=now - timedelta(minutes=3),
                )
            ],
            expected_escalation=True,
        ),
        ScenarioInput(
            scenario_id="scenario_4",
            title="Multi-Source Flood G-11",
            description="Two independent social reports plus rainfall and traffic slowdown indicate a G-11 flood cluster.",
            social_posts=[
                SocialPost(
                    post_id="s4-social-1",
                    text="G11 mein bijli bhi gayi aur pani bhi aa gaya",
                    timestamp=now - timedelta(minutes=8),
                    language=LanguageLabel.URDU_ROMAN,
                    reporter_hash="user_d1",
                ),
                SocialPost(
                    post_id="s4-social-2",
                    text="yar G-11 ka haal bohot bura hai ghar mein paani ghus raha hai",
                    timestamp=now - timedelta(minutes=5),
                    language=LanguageLabel.URDU_ROMAN,
                    reporter_hash="user_d2",
                ),
            ],
            weather=WeatherReport(
                report_id="s4-weather-1",
                district="Islamabad",
                rainfall_mm_per_hour=9.2,
                alert_active=True,
                alert_type="flood_alert",
                alert_level=3,
                timestamp=now - timedelta(minutes=3),
            ),
            traffic=[
                TrafficReport(
                    report_id="s4-traffic-1",
                    road_name="G-11 Markaz road",
                    speed_kmh=1.0,
                    normal_speed_kmh=28.0,
                    congestion_level=5,
                    timestamp=now - timedelta(minutes=4),
                )
            ],
            expected_escalation=True,
        ),
        ScenarioInput(
            scenario_id="scenario_5",
            title="Low Confidence Single Signal",
            description="A stale, weak social post with no weather alert and normal traffic must not escalate.",
            social_posts=[
                SocialPost(
                    post_id="s5-social-1",
                    text="thodi baarish ho rahi hai G-10 mein",
                    timestamp=now - timedelta(minutes=25),
                    language=LanguageLabel.URDU_ROMAN,
                    reporter_hash="user_e1",
                )
            ],
            weather=WeatherReport(
                report_id="s5-weather-1",
                district="Islamabad",
                rainfall_mm_per_hour=1.2,
                alert_active=False,
                alert_type="none",
                alert_level=0,
                timestamp=now - timedelta(minutes=1),
            ),
            traffic=[
                TrafficReport(
                    report_id="s5-traffic-1",
                    road_name="Khayaban-e-Iqbal",
                    speed_kmh=35.0,
                    normal_speed_kmh=38.0,
                    congestion_level=1,
                    timestamp=now - timedelta(minutes=1),
                ),
                TrafficReport(
                    report_id="s5-traffic-2",
                    road_name="Margalla Road sector crossing",
                    speed_kmh=33.0,
                    normal_speed_kmh=35.0,
                    congestion_level=1,
                    timestamp=now - timedelta(minutes=1),
                ),
            ],
            expected_escalation=False,
            expected_confidence_max=0.3,
        ),
    ]

    return {scenario.scenario_id: scenario for scenario in scenarios}


# Cache scenarios at module-load time so timestamps are consistent across calls.
_SCENARIOS: Dict[str, ScenarioInput] = build_scenarios()


def list_scenarios(reference_time: datetime | None = None) -> List[ScenarioInput]:
    if reference_time is not None:
        return list(build_scenarios(reference_time).values())
    return list(_SCENARIOS.values())


def get_scenario(scenario_id: str, reference_time: datetime | None = None) -> ScenarioInput:
    scenarios = build_scenarios(reference_time) if reference_time is not None else _SCENARIOS
    try:
        return scenarios[scenario_id]
    except KeyError as exc:
        available = ", ".join(sorted(scenarios))
        raise KeyError(f"Unknown scenario_id '{scenario_id}'. Available scenarios: {available}") from exc
