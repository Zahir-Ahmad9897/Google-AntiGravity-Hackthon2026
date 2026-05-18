from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import Field, StrictBool, StrictFloat, StrictInt, StrictStr

from backend.schemas import ScenarioInput, StrictSchema, utc_now


class IterativeScenarioStep(StrictSchema):
    iteration_number: StrictInt = Field(ge=1, le=3)
    update_note: StrictStr
    scenario: ScenarioInput
    approved_context: List[StrictStr] = Field(default_factory=list)
    permission_granted: StrictBool = True


class IterativeScenarioDefinition(StrictSchema):
    scenario_id: StrictStr
    title: StrictStr
    description: StrictStr
    steps: List[IterativeScenarioStep] = Field(min_length=3, max_length=3)


class HumanApprovalRecord(StrictSchema):
    scenario_id: StrictStr
    approved: StrictBool
    approval_status: StrictStr
    approved_by: StrictStr
    approval_scope: List[StrictStr]
    privacy_constraints: List[StrictStr]
    timestamp: datetime = Field(default_factory=utc_now)


class AgentStepOutput(StrictSchema):
    agent_name: StrictStr
    summary: StrictStr
    confidence_score: StrictFloat = Field(ge=0.0, le=1.0)
    reasoning_summary: StrictStr
    output: Dict[str, Any] = Field(default_factory=dict)
    actions: List[StrictStr] = Field(default_factory=list)


class IterationTrace(StrictSchema):
    scenario_id: StrictStr
    scenario_name: StrictStr
    iteration_number: StrictInt = Field(ge=1, le=3)
    input_sources: List[StrictStr]
    agent_outputs: List[AgentStepOutput]
    confidence_score: StrictFloat = Field(ge=0.0, le=1.0)
    concise_reasoning_summary: StrictStr
    action_plan: List[StrictStr]
    simulated_actions: List[StrictStr]
    evaluation_result: StrictStr
    next_step: StrictStr
    approval_status: StrictStr
    crisis_level: StrictStr
    risk_score: StrictFloat = Field(ge=0.0, le=1.0)


class RiskScoreRecord(StrictSchema):
    scenario_id: StrictStr
    scenario_name: StrictStr
    iteration_scores: List[Dict[str, Any]]
    final_score: StrictFloat = Field(ge=0.0, le=1.0)
    final_crisis_level: StrictStr


class AgentToolCallRecord(StrictSchema):
    iteration_number: StrictInt = Field(ge=1, le=3)
    agent_name: StrictStr
    tool_name: StrictStr
    purpose: StrictStr
    status: StrictStr
    simulated: StrictBool = True


class IterativePipelineResult(StrictSchema):
    scenario_id: StrictStr
    scenario_name: StrictStr
    description: StrictStr
    iterations: List[IterationTrace]
    risk_score: RiskScoreRecord
    agent_tool_calls: List[AgentToolCallRecord]
    rescue_action_plan: StrictStr
    final_crisis_report: StrictStr
    human_approval: HumanApprovalRecord
    artifact_files: List[StrictStr]
    final_crisis_level: StrictStr
    final_confidence_score: StrictFloat = Field(ge=0.0, le=1.0)
    mini_assistant_summary: StrictStr
    latest_artifact: Optional[StrictStr] = None
