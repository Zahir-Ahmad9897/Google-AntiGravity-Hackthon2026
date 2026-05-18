from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictFloat, StrictInt, StrictStr


class StrictSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_assignment=True,
        str_strip_whitespace=True,
        use_enum_values=False,
    )


JsonPrimitive = Union[StrictStr, StrictInt, StrictFloat, StrictBool]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class SourceType(str, Enum):
    SOCIAL = "social"
    WEATHER = "weather"
    TRAFFIC = "traffic"


class LanguageLabel(str, Enum):
    ENGLISH = "english"
    URDU_ROMAN = "urdu_roman"
    MIXED = "mixed"
    UNKNOWN = "unknown"


class CrisisType(str, Enum):
    URBAN_FLOODING = "urban_flooding"
    FLASH_FLOOD = "flash_flood"
    ACCIDENT = "accident"
    ROAD_BLOCKAGE = "road_blockage"
    INFRASTRUCTURE_FAILURE = "infrastructure_failure"
    NO_CRISIS = "no_crisis"


class ConfidenceBand(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class EscalationLevel(str, Enum):
    NO_ESCALATION = "no_escalation"
    WATCHLIST = "watchlist"
    CRISIS = "crisis"


class AgentName(str, Enum):
    SIGNAL_WATCHER = "signal_watcher"
    CRISIS_DETECTOR = "crisis_detector"
    SITUATION_ANALYST = "situation_analyst"
    RESPONSE_PLANNER = "response_planner"
    EXECUTION_SIMULATOR = "execution_simulator"
    IMPACT_REPORTER = "impact_reporter"


class ActionType(str, Enum):
    REROUTE_TRAFFIC = "reroute_traffic"
    DISPATCH_EMERGENCY = "dispatch_emergency"
    SEND_ALERT = "send_alert"
    OPEN_SHELTER = "open_shelter"
    MONITOR_ONLY = "monitor_only"


class ActionStatus(str, Enum):
    PLANNED = "planned"
    SIMULATED = "simulated"
    SKIPPED = "skipped"


class SocialPost(StrictSchema):
    post_id: StrictStr
    text: StrictStr
    platform: StrictStr = "simulated_social"
    timestamp: datetime
    language: LanguageLabel
    reporter_hash: Optional[StrictStr] = None


class WeatherReport(StrictSchema):
    report_id: StrictStr
    district: StrictStr
    rainfall_mm_per_hour: StrictFloat = Field(ge=0.0)
    alert_active: StrictBool
    alert_type: StrictStr
    alert_level: StrictInt = Field(ge=0, le=5)
    timestamp: datetime


class TrafficReport(StrictSchema):
    report_id: StrictStr
    road_name: StrictStr
    speed_kmh: StrictFloat = Field(ge=0.0)
    normal_speed_kmh: StrictFloat = Field(gt=0.0)
    congestion_level: StrictInt = Field(ge=0, le=5)
    timestamp: datetime


class ScenarioInput(StrictSchema):
    scenario_id: StrictStr
    title: StrictStr
    description: StrictStr
    social_posts: List[SocialPost]
    weather: WeatherReport
    traffic: List[TrafficReport]
    expected_escalation: StrictBool
    expected_confidence_max: Optional[StrictFloat] = Field(default=None, ge=0.0, le=1.0)


class SignalEvent(StrictSchema):
    event_id: StrictStr
    source_type: SourceType
    location: StrictStr
    crisis_type: CrisisType
    urgency_score: StrictInt = Field(ge=0, le=5)
    confidence_hint: StrictFloat = Field(ge=0.0, le=1.0)
    timestamp: datetime
    raw_text: Optional[StrictStr] = None
    evidence: List[StrictStr] = Field(default_factory=list)
    metadata: Dict[StrictStr, JsonPrimitive] = Field(default_factory=dict)


class ConfidenceBreakdown(StrictSchema):
    formula_text: StrictStr
    base_confidence: StrictFloat = Field(ge=0.0, le=1.0)
    correlated_signal_count: StrictInt = Field(ge=0)
    source_type_count: StrictInt = Field(ge=0, le=3)
    correlated_signal_addition: StrictFloat = Field(ge=0.0, le=0.4)
    weather_alert_addition: StrictFloat = Field(ge=0.0, le=0.1)
    stale_signal_penalty: StrictFloat = Field(ge=0.0, le=0.1)
    single_source_penalty: StrictFloat = Field(ge=0.0, le=0.1)
    raw_score_before_bounds: StrictFloat
    final_score: StrictFloat = Field(ge=0.2, le=1.0)


class CrisisCluster(StrictSchema):
    cluster_id: StrictStr
    location: StrictStr
    crisis_type: CrisisType
    signals: List[SignalEvent]
    source_types: List[SourceType]
    time_window_minutes: StrictFloat = Field(ge=0.0)
    confidence: ConfidenceBreakdown
    confidence_band: ConfidenceBand
    escalation: EscalationLevel
    evidence: List[StrictStr]


class AgentLog(StrictSchema):
    agent_name: AgentName
    message: StrictStr
    timestamp: datetime = Field(default_factory=utc_now)


class SignalWatcherOutput(StrictSchema):
    agent_name: Literal[AgentName.SIGNAL_WATCHER]
    signals: List[SignalEvent]
    ignored_inputs: List[StrictStr]
    reasoning_chain: List[StrictStr]


class CrisisDetectorOutput(StrictSchema):
    agent_name: Literal[AgentName.CRISIS_DETECTOR]
    clusters: List[CrisisCluster]
    selected_cluster: Optional[CrisisCluster]
    reasoning_chain: List[StrictStr]


class SituationAnalysis(StrictSchema):
    detected_situation: StrictStr
    location: StrictStr
    crisis_type: CrisisType
    severity_score: StrictInt = Field(ge=0, le=5)
    confidence: ConfidenceBreakdown
    confidence_band: ConfidenceBand
    escalation: EscalationLevel
    affected_roads: List[StrictStr]
    affected_population_density_per_sq_km: StrictInt = Field(ge=0)
    primary_risks: List[StrictStr]
    secondary_risks: List[StrictStr]
    reasoning_chain: List[StrictStr]


class SituationAnalystOutput(StrictSchema):
    agent_name: Literal[AgentName.SITUATION_ANALYST]
    analysis: SituationAnalysis
    reasoning_chain: List[StrictStr]


class ResponseAction(StrictSchema):
    action_id: StrictStr
    action_type: ActionType
    description: StrictStr
    target: StrictStr
    priority: StrictInt = Field(ge=1, le=5)
    assigned_resource: Optional[StrictStr] = None
    status: ActionStatus = ActionStatus.PLANNED


class ResponsePlan(StrictSchema):
    should_escalate: StrictBool
    selected_depot: Optional[StrictStr]
    selected_shelter: Optional[StrictStr]
    alternate_routes: List[StrictStr]
    actions: List[ResponseAction]
    limitations: List[StrictStr]


class ResponsePlannerOutput(StrictSchema):
    agent_name: Literal[AgentName.RESPONSE_PLANNER]
    plan: ResponsePlan
    reasoning_chain: List[StrictStr]


class SimulationStateChange(StrictSchema):
    metric: StrictStr
    before: StrictStr
    after: StrictStr
    unit: StrictStr


class EmergencyTicket(StrictSchema):
    ticket_id: StrictStr
    location: StrictStr
    crisis_type: CrisisType
    assigned_depot: StrictStr
    priority: StrictInt = Field(ge=1, le=5)
    status: ActionStatus


class SimulatedExecution(StrictSchema):
    route_updates: List[StrictStr]
    alerts_sent: List[StrictStr]
    tickets_created: List[EmergencyTicket]
    state_changes: List[SimulationStateChange]
    system_status: StrictStr


class ExecutionSimulatorOutput(StrictSchema):
    agent_name: Literal[AgentName.EXECUTION_SIMULATOR]
    execution: SimulatedExecution
    reasoning_chain: List[StrictStr]


class ImpactReport(StrictSchema):
    summary: StrictStr
    before_after: List[SimulationStateChange]
    impact_score: StrictFloat = Field(ge=0.0, le=1.0)
    remaining_risk: StrictStr
    no_escalation_reason: Optional[StrictStr]
    reasoning_chain: List[StrictStr]


class ImpactReporterOutput(StrictSchema):
    agent_name: Literal[AgentName.IMPACT_REPORTER]
    report: ImpactReport
    reasoning_chain: List[StrictStr]


class PipelineResult(StrictSchema):
    scenario: ScenarioInput
    signal_watcher: SignalWatcherOutput
    crisis_detector: CrisisDetectorOutput
    situation_analyst: SituationAnalystOutput
    response_planner: ResponsePlannerOutput
    execution_simulator: ExecutionSimulatorOutput
    impact_reporter: ImpactReporterOutput
    final_status: EscalationLevel
    logs: List[AgentLog]
