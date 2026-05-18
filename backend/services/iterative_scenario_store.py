from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict, List

from backend.iterative_schemas import IterativeScenarioDefinition, IterativeScenarioStep
from backend.schemas import LanguageLabel, ScenarioInput, SocialPost, TrafficReport, WeatherReport


def _now(reference_time: datetime | None = None) -> datetime:
    return reference_time or datetime.now(timezone.utc)


def _post(post_id: str, text: str, timestamp: datetime, reporter_hash: str) -> SocialPost:
    return SocialPost(
        post_id=post_id,
        text=text,
        timestamp=timestamp,
        language=LanguageLabel.MIXED,
        reporter_hash=reporter_hash,
    )


def _weather(
    report_id: str,
    district: str,
    rainfall: float,
    alert_active: bool,
    alert_type: str,
    alert_level: int,
    timestamp: datetime,
) -> WeatherReport:
    return WeatherReport(
        report_id=report_id,
        district=district,
        rainfall_mm_per_hour=rainfall,
        alert_active=alert_active,
        alert_type=alert_type,
        alert_level=alert_level,
        timestamp=timestamp,
    )


def _traffic(
    report_id: str,
    road_name: str,
    speed: float,
    normal: float,
    congestion: int,
    timestamp: datetime,
) -> TrafficReport:
    return TrafficReport(
        report_id=report_id,
        road_name=road_name,
        speed_kmh=speed,
        normal_speed_kmh=normal,
        congestion_level=congestion,
        timestamp=timestamp,
    )


def build_iterative_scenarios(reference_time: datetime | None = None) -> Dict[str, IterativeScenarioDefinition]:
    now = _now(reference_time)

    scenarios = [
        IterativeScenarioDefinition(
            scenario_id="g10_urban_flooding",
            title="Islamabad G-10 urban flooding",
            description="Flooding signals grow from one public report into verified weather and traffic disruption.",
            steps=[
                IterativeScenarioStep(
                    iteration_number=1,
                    update_note="Initial public report; weather below alert threshold; traffic still moving.",
                    scenario=ScenarioInput(
                        scenario_id="g10_urban_flooding",
                        title="Islamabad G-10 urban flooding",
                        description="Initial G-10 flooding detection.",
                        social_posts=[
                            _post(
                                "g10-i1-public-1",
                                "G-10 mein pani jama ho raha hai underpass slow hai, log careful rahen",
                                now - timedelta(minutes=12),
                                "g10_user_1",
                            )
                        ],
                        weather=_weather(
                            "g10-i1-weather",
                            "Islamabad",
                            4.8,
                            False,
                            "rain_watch",
                            1,
                            now - timedelta(minutes=10),
                        ),
                        traffic=[
                            _traffic("g10-i1-traffic-1", "Khayaban-e-Iqbal", 14.0, 38.0, 3, now - timedelta(minutes=9)),
                            _traffic("g10-i1-traffic-2", "Margalla Road sector crossing", 18.0, 35.0, 2, now - timedelta(minutes=9)),
                        ],
                        expected_escalation=False,
                    ),
                    approved_context=["User approved reading the visible G-10 public report for this demo run."],
                ),
                IterativeScenarioStep(
                    iteration_number=2,
                    update_note="Rainfall alert activates and roads become blocked.",
                    scenario=ScenarioInput(
                        scenario_id="g10_urban_flooding",
                        title="Islamabad G-10 urban flooding",
                        description="Verified G-10 flooding escalation.",
                        social_posts=[
                            _post(
                                "g10-i2-public-1",
                                "bhai G10 mein pani aa gaya bohot zyada, gariyan phase gayi hain Margalla road avoid karo",
                                now - timedelta(minutes=6),
                                "g10_user_2",
                            )
                        ],
                        weather=_weather(
                            "g10-i2-weather",
                            "Islamabad",
                            9.1,
                            True,
                            "flood_alert",
                            3,
                            now - timedelta(minutes=5),
                        ),
                        traffic=[
                            _traffic("g10-i2-traffic-1", "Khayaban-e-Iqbal", 0.0, 38.0, 5, now - timedelta(minutes=4)),
                            _traffic("g10-i2-traffic-2", "Margalla Road sector crossing", 3.0, 35.0, 5, now - timedelta(minutes=4)),
                        ],
                        expected_escalation=True,
                    ),
                    approved_context=["User approved reading the updated G-10 public report for this demo run."],
                ),
                IterativeScenarioStep(
                    iteration_number=3,
                    update_note="One corridor improves, but water shifts toward the Margalla crossing.",
                    scenario=ScenarioInput(
                        scenario_id="g10_urban_flooding",
                        title="Islamabad G-10 urban flooding",
                        description="G-10 flood response re-planning.",
                        social_posts=[
                            _post(
                                "g10-i3-public-1",
                                "Khayaban thora clear hai lekin Margalla crossing pe pani abhi bhi zyada hai avoid karo",
                                now - timedelta(minutes=2),
                                "g10_user_3",
                            )
                        ],
                        weather=_weather(
                            "g10-i3-weather",
                            "Islamabad",
                            6.2,
                            True,
                            "flood_alert",
                            2,
                            now - timedelta(minutes=2),
                        ),
                        traffic=[
                            _traffic("g10-i3-traffic-1", "Khayaban-e-Iqbal", 12.0, 38.0, 3, now - timedelta(minutes=1)),
                            _traffic("g10-i3-traffic-2", "Margalla Road sector crossing", 4.0, 35.0, 4, now - timedelta(minutes=1)),
                        ],
                        expected_escalation=True,
                    ),
                    approved_context=["User approved reading the latest G-10 public report for this demo run."],
                ),
            ],
        ),
        IterativeScenarioDefinition(
            scenario_id="peshawar_ring_road_blast",
            title="Peshawar Ring Road blast and blockage",
            description="Blast report evolves into verified road closure, then partial de-escalation after rerouting.",
            steps=[
                IterativeScenarioStep(
                    iteration_number=1,
                    update_note="Single authorized public report mentions a blast; traffic impact not yet confirmed.",
                    scenario=ScenarioInput(
                        scenario_id="peshawar_ring_road_blast",
                        title="Peshawar Ring Road blast and blockage",
                        description="Initial Peshawar blast report.",
                        social_posts=[
                            _post(
                                "prr-i1-public-1",
                                "Peshawar Ring Road ke qareeb blast ki awaz ayi hai, log ruk gaye hain",
                                now - timedelta(minutes=11),
                                "prr_user_1",
                            )
                        ],
                        weather=_weather("prr-i1-weather", "Peshawar", 0.0, False, "none", 0, now - timedelta(minutes=10)),
                        traffic=[
                            _traffic("prr-i1-traffic-1", "Peshawar Ring Road", 20.0, 45.0, 3, now - timedelta(minutes=9))
                        ],
                        expected_escalation=False,
                    ),
                    approved_context=["User approved the visible Ring Road emergency post for this demo run."],
                ),
                IterativeScenarioStep(
                    iteration_number=2,
                    update_note="Traffic confirms blockage and a second authorized report requests avoidance.",
                    scenario=ScenarioInput(
                        scenario_id="peshawar_ring_road_blast",
                        title="Peshawar Ring Road blast and blockage",
                        description="Verified Peshawar Ring Road blockage.",
                        social_posts=[
                            _post(
                                "prr-i2-public-1",
                                "Ring Road Peshawar pe blast ke baad road block hai, ambulance ko alternate route chahiye",
                                now - timedelta(minutes=5),
                                "prr_user_2",
                            )
                        ],
                        weather=_weather("prr-i2-weather", "Peshawar", 0.0, False, "none", 0, now - timedelta(minutes=5)),
                        traffic=[
                            _traffic("prr-i2-traffic-1", "Peshawar Ring Road", 0.0, 45.0, 5, now - timedelta(minutes=4)),
                            _traffic("prr-i2-traffic-2", "University Road diversion", 4.0, 32.0, 4, now - timedelta(minutes=4)),
                        ],
                        expected_escalation=True,
                    ),
                    approved_context=["User approved reading the updated Ring Road emergency post for this demo run."],
                ),
                IterativeScenarioStep(
                    iteration_number=3,
                    update_note="Primary blockage remains sealed, but diversion traffic improves after simulated reroute.",
                    scenario=ScenarioInput(
                        scenario_id="peshawar_ring_road_blast",
                        title="Peshawar Ring Road blast and blockage",
                        description="Peshawar Ring Road re-planning and partial de-escalation.",
                        social_posts=[
                            _post(
                                "prr-i3-public-1",
                                "Ring Road abhi sealed hai lekin University Road diversion chal rahi hai, rush kam ho raha hai",
                                now - timedelta(minutes=2),
                                "prr_user_3",
                            )
                        ],
                        weather=_weather("prr-i3-weather", "Peshawar", 0.0, False, "none", 0, now - timedelta(minutes=2)),
                        traffic=[
                            _traffic("prr-i3-traffic-1", "Peshawar Ring Road", 6.0, 45.0, 4, now - timedelta(minutes=1)),
                            _traffic("prr-i3-traffic-2", "University Road diversion", 18.0, 32.0, 2, now - timedelta(minutes=1)),
                        ],
                        expected_escalation=True,
                    ),
                    approved_context=["User approved reading the final Ring Road status post for this demo run."],
                ),
            ],
        ),
        IterativeScenarioDefinition(
            scenario_id="ambulance_rain_congestion",
            title="Ambulance stuck during rain and congestion",
            description="Rain and traffic congestion trap an ambulance, requiring reroute and re-evaluation.",
            steps=[
                IterativeScenarioStep(
                    iteration_number=1,
                    update_note="Rain and congestion begin slowing an ambulance route.",
                    scenario=ScenarioInput(
                        scenario_id="ambulance_rain_congestion",
                        title="Ambulance stuck during rain and congestion",
                        description="Initial ambulance delay detection.",
                        social_posts=[
                            _post(
                                "amb-i1-public-1",
                                "G-10 ke paas ambulance slow hai, rain aur traffic jam ki wajah se delay ho raha hai",
                                now - timedelta(minutes=9),
                                "amb_user_1",
                            )
                        ],
                        weather=_weather("amb-i1-weather", "Islamabad", 6.0, True, "rain_alert", 2, now - timedelta(minutes=8)),
                        traffic=[
                            _traffic("amb-i1-traffic-1", "Khayaban-e-Iqbal", 5.0, 38.0, 4, now - timedelta(minutes=7))
                        ],
                        expected_escalation=True,
                    ),
                    approved_context=["User approved reading the visible ambulance delay report for this demo run."],
                ),
                IterativeScenarioStep(
                    iteration_number=2,
                    update_note="Congestion worsens and ambulance is reported stuck.",
                    scenario=ScenarioInput(
                        scenario_id="ambulance_rain_congestion",
                        title="Ambulance stuck during rain and congestion",
                        description="Ambulance delay escalation.",
                        social_posts=[
                            _post(
                                "amb-i2-public-1",
                                "Ambulance G-10 signal pe phans gayi hai, pani aur congestion bohot zyada hai urgent reroute karo",
                                now - timedelta(minutes=4),
                                "amb_user_2",
                            )
                        ],
                        weather=_weather("amb-i2-weather", "Islamabad", 8.0, True, "flood_alert", 3, now - timedelta(minutes=4)),
                        traffic=[
                            _traffic("amb-i2-traffic-1", "Khayaban-e-Iqbal", 0.0, 38.0, 5, now - timedelta(minutes=3)),
                            _traffic("amb-i2-traffic-2", "Srinagar Highway G-10 underpass", 3.0, 50.0, 5, now - timedelta(minutes=3)),
                        ],
                        expected_escalation=True,
                    ),
                    approved_context=["User approved reading the updated ambulance delay report for this demo run."],
                ),
                IterativeScenarioStep(
                    iteration_number=3,
                    update_note="Ambulance is rerouted, but flood and congestion monitoring continues.",
                    scenario=ScenarioInput(
                        scenario_id="ambulance_rain_congestion",
                        title="Ambulance stuck during rain and congestion",
                        description="Ambulance reroute follow-up.",
                        social_posts=[
                            _post(
                                "amb-i3-public-1",
                                "Ambulance alternate route se nikal gayi hai, G-10 underpass par traffic abhi slow hai",
                                now - timedelta(minutes=1),
                                "amb_user_3",
                            )
                        ],
                        weather=_weather("amb-i3-weather", "Islamabad", 5.2, True, "rain_alert", 2, now - timedelta(minutes=1)),
                        traffic=[
                            _traffic("amb-i3-traffic-1", "Khayaban-e-Iqbal", 16.0, 38.0, 2, now),
                            _traffic("amb-i3-traffic-2", "Srinagar Highway G-10 underpass", 7.0, 50.0, 4, now),
                        ],
                        expected_escalation=True,
                    ),
                    approved_context=["User approved reading the final ambulance route update for this demo run."],
                ),
            ],
        ),
    ]

    return {scenario.scenario_id: scenario for scenario in scenarios}


_ITERATIVE_SCENARIOS: Dict[str, IterativeScenarioDefinition] = build_iterative_scenarios()


def list_iterative_scenarios(reference_time: datetime | None = None) -> List[IterativeScenarioDefinition]:
    if reference_time is not None:
        return list(build_iterative_scenarios(reference_time).values())
    return list(_ITERATIVE_SCENARIOS.values())


def get_iterative_scenario(
    scenario_id: str,
    reference_time: datetime | None = None,
) -> IterativeScenarioDefinition:
    scenarios = build_iterative_scenarios(reference_time) if reference_time is not None else _ITERATIVE_SCENARIOS
    try:
        return scenarios[scenario_id]
    except KeyError as exc:
        available = ", ".join(sorted(scenarios))
        raise KeyError(f"Unknown iterative scenario_id '{scenario_id}'. Available scenarios: {available}") from exc
