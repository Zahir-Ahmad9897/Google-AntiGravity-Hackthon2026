export type PermissionState = {
  locationContext: boolean;
  publicEmergencyReports: boolean;
  trafficWeatherContext: boolean;
  manualReports: boolean;
};

export type ScenarioSummary = {
  scenario_id: string;
  title: string;
  description: string;
  location: string;
  riskType: string;
  expectedAgentBehavior: string;
  customText?: string;
  urgency?: ManualReport['urgency'];
};

export type AgentStepOutput = {
  agent_name: string;
  summary: string;
  confidence_score: number;
  reasoning_summary: string;
  output: Record<string, unknown>;
  actions: string[];
};

export type IterationTrace = {
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
};

export type HumanApprovalRecord = {
  scenario_id: string;
  approved: boolean;
  approval_status: string;
  approved_by: string;
  approval_scope: string[];
  privacy_constraints: string[];
  timestamp: string;
};

export type RiskScoreRecord = {
  scenario_id: string;
  scenario_name: string;
  iteration_scores: Array<Record<string, unknown>>;
  final_score: number;
  final_crisis_level: string;
};

export type PipelineResult = {
  scenario_id: string;
  scenario_name: string;
  description: string;
  iterations: IterationTrace[];
  risk_score: RiskScoreRecord;
  rescue_action_plan: string;
  final_crisis_report: string;
  human_approval: HumanApprovalRecord;
  artifact_files: string[];
  final_crisis_level: string;
  final_confidence_score: number;
  mini_assistant_summary: string;
  latest_artifact?: string;
};

export type ArtifactInfo = {
  filename: string;
  path: string;
  size_bytes: number;
  modified_utc: number;
};

export type ManualReport = {
  eventType: string;
  location: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  source: string;
  permissionGranted: boolean;
};

export type MiniAssistantSignal = {
  is_crisis_related: boolean;
  crisis_type: string;
  location: string;
  urgency: string;
  confidence: number;
  language_detected: string;
  entities: {
    roads: string[];
    areas: string[];
    hazards: string[];
    time_mentions: string[];
  };
  reasoning_summary: string;
  privacy_status: string;
  source: string;
};

export type ActionDecision = {
  actionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'replan_requested';
  note: string;
};
