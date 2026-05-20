export interface AgentStepOutput {
  agent_name: string;
  summary: string;
  confidence_score: number;
  reasoning_summary: string;
  output: Record<string, unknown>;
  actions: string[];
}
