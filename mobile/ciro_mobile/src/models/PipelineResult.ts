import { AgentStepOutput } from './AgentStep';

export interface IterationTrace {
  scenario_id: string;
  scenario_name: string;
  iteration_number: number;
  input_sources: string[];
  agent_outputs: AgentStepOutput[];
  confidence_score: number;
  concise_reasoning_summary: string;
  action_plan: string[];
  simulated_actions: string[];
  evaluation_result: string;
  next_step: string;
  approval_status: string;
  crisis_level: string;
  risk_score: number;
}

export interface RiskScoreRecord {
  scenario_id: string;
  scenario_name: string;
  iteration_scores: Array<Record<string, unknown>>;
  final_score: number;
  final_crisis_level: string;
}

export interface AgentToolCallRecord {
  iteration_number: number;
  agent_name: string;
  tool_name: string;
  purpose: string;
  status: string;
  simulated: boolean;
}

export interface HumanApprovalRecord {
  scenario_id: string;
  approved: boolean;
  approval_status: string;
  approved_by: string;
  approval_scope: string[];
  privacy_constraints: string[];
  timestamp: string;
}

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface MapRoute {
  label: string;
  route_type: string;
  distance_text?: string;
  duration_text?: string;
  polyline: MapPoint[];
}

export interface MapPayload {
  center: MapPoint;
  markers?: Record<string, { label?: string; position?: MapPoint; severity?: string; status?: string; condition?: string }>;
  blocked_route?: MapRoute;
  alternate_route?: MapRoute;
  dispatch_route?: MapRoute;
  route_intelligence?: Record<string, unknown>;
  weather_intelligence?: Record<string, unknown>;
}

export interface PipelineResult {
  scenario_id: string;
  scenario_name: string;
  description: string;
  iterations: IterationTrace[];
  risk_score: RiskScoreRecord;
  agent_tool_calls: AgentToolCallRecord[];
  rescue_action_plan: string;
  final_crisis_report: string;
  human_approval: HumanApprovalRecord;
  artifact_files: string[];
  final_crisis_level: string;
  final_confidence_score: number;
  mini_assistant_summary: string;
  latest_artifact?: string | null;
  map_payload?: MapPayload | null;
}
