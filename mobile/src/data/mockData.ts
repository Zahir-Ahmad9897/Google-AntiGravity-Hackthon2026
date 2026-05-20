import type { ArtifactInfo, MiniAssistantSignal, PipelineResult, ScenarioSummary } from '../types/api';

export const mockScenarios: ScenarioSummary[] = [
  {
    scenario_id: 'g10_urban_flooding',
    title: 'Islamabad G-10 urban flooding',
    description: 'Flooding signals grow from public report into verified weather and traffic disruption.',
    location: 'G-10 Islamabad',
    riskType: 'Urban flooding',
    expectedAgentBehavior: 'Weather, traffic, public signal, verification, reroute, shelter planning.',
  },
  {
    scenario_id: 'peshawar_ring_road_blast',
    title: 'Peshawar Ring Road blast/road blockage',
    description: 'Blast report evolves into verified road closure and reroute planning.',
    location: 'Peshawar Ring Road',
    riskType: 'Blast and road blockage',
    expectedAgentBehavior: 'Public report verification, road closure analysis, alternate route plan.',
  },
  {
    scenario_id: 'ambulance_rain_congestion',
    title: 'Ambulance stuck during rain + congestion',
    description: 'Rain and traffic trap an ambulance, requiring route update and re-evaluation.',
    location: 'G-10 / PIMS Islamabad',
    riskType: 'Ambulance delay',
    expectedAgentBehavior: 'Traffic/weather correlation, ambulance reroute, simulated dispatch update.',
  },
];

const agents = [
  'CIRO Commander Agent',
  'Weather Risk Agent',
  'Traffic Analysis Agent',
  'Social/Public Signal Agent',
  'Verification Agent',
  'Crisis Reasoning Agent',
  'Rescue Planning Agent',
  'Action Execution Agent',
  'Evaluation/Replanning Agent',
];

export const mockPipelineResult: PipelineResult = {
  scenario_id: 'g10_urban_flooding',
  scenario_name: 'Islamabad G-10 urban flooding',
  description: 'Mock fallback run used when CIRO backend is unavailable.',
  final_crisis_level: 'crisis',
  final_confidence_score: 0.88,
  latest_artifact: 'final_crisis_report.md',
  mini_assistant_summary: 'Permission-based contextual signal analyzed in mock mode.',
  human_approval: {
    scenario_id: 'g10_urban_flooding',
    approved: true,
    approval_status: 'approved_for_simulation',
    approved_by: 'field_officer_demo',
    approval_scope: ['Simulated route update', 'Simulated rescue alert', 'Artifact review'],
    privacy_constraints: ['No hidden monitoring', 'No real emergency contact'],
    timestamp: new Date().toISOString(),
  },
  risk_score: {
    scenario_id: 'g10_urban_flooding',
    scenario_name: 'Islamabad G-10 urban flooding',
    final_score: 0.84,
    final_crisis_level: 'crisis',
    iteration_scores: [
      { iteration_number: 1, risk_score: 0.55, confidence_score: 0.62, crisis_level: 'watchlist' },
      { iteration_number: 2, risk_score: 0.84, confidence_score: 0.86, crisis_level: 'crisis' },
      { iteration_number: 3, risk_score: 0.8, confidence_score: 0.88, crisis_level: 'crisis' },
    ],
  },
  iterations: [1, 2, 3].map((iteration) => ({
    scenario_id: 'g10_urban_flooding',
    scenario_name: 'Islamabad G-10 urban flooding',
    iteration_number: iteration,
    input_sources: ['simulated_weather', 'simulated_traffic', 'user_approved_public_reports'],
    confidence_score: iteration === 1 ? 0.62 : iteration === 2 ? 0.86 : 0.88,
    concise_reasoning_summary:
      iteration === 1
        ? 'Initial flooding indicators detected with moderate confidence.'
        : 'Correlated weather, traffic, and public reports support crisis-level response.',
    action_plan: [
      'reroute_traffic -> Srinagar Highway G-10 underpass: Update mock map routing away from blocked segment.',
      'dispatch_emergency -> G-10: Dispatch simulated response unit.',
      'send_alert -> G-10: Generate simulated public warning.',
    ],
    simulated_actions: [
      'Mock map route updated away from unsafe road.',
      'Simulated rescue alert generated.',
      'Emergency ticket created in simulation.',
    ],
    evaluation_result:
      iteration === 3
        ? 'Final evaluation: congestion reduced after simulated reroute; remaining flood risk is monitored.'
        : 'Continue monitoring and re-plan with updated signals.',
    next_step: iteration === 3 ? 'Finalize crisis report and artifacts.' : 'Run next iteration.',
    approval_status: 'approved_for_simulation',
    crisis_level: iteration === 1 ? 'watchlist' : 'crisis',
    risk_score: iteration === 1 ? 0.55 : iteration === 2 ? 0.84 : 0.8,
    agent_outputs: agents.map((agentName, index) => ({
      agent_name: agentName,
      summary: `${agentName} completed iteration ${iteration}.`,
      confidence_score: Math.max(0.5, 0.9 - index * 0.03),
      reasoning_summary: 'Concise mock reasoning summary only; no hidden chain-of-thought.',
      output: { iteration, mock: true },
      actions: ['observe', 'summarize'],
    })),
  })),
  artifact_files: [
    'artifacts\\scenario_input.json',
    'artifacts\\iteration_1_decision_trace.json',
    'artifacts\\iteration_2_replan_trace.json',
    'artifacts\\iteration_3_final_trace.json',
    'artifacts\\risk_score.json',
    'artifacts\\rescue_action_plan.md',
    'artifacts\\final_crisis_report.md',
    'artifacts\\human_approval_record.json',
  ],
  rescue_action_plan: '# Rescue Action Plan\n\n- Reroute ambulance.\n- Mark unsafe road.\n- Generate simulated rescue alert.',
  final_crisis_report:
    '# Final Crisis Report\n\nFinal crisis level: crisis\n\nAll actions were simulated and approved for demo use only.',
};

export const mockArtifacts: ArtifactInfo[] = mockPipelineResult.artifact_files.map((path, index) => {
  const filename = path.split(/[\\/]/).pop() || path;
  return {
    filename,
    path,
    size_bytes: 1024 + index * 128,
    modified_utc: Date.now() / 1000,
  };
});

export const mockMiniAssistantSignal: MiniAssistantSignal = {
  is_crisis_related: true,
  crisis_type: 'road_blockage',
  location: 'G-10 Islamabad',
  urgency: 'high',
  confidence: 0.82,
  language_detected: 'mixed',
  entities: {
    roads: ['G-10 Islamabad'],
    areas: ['G-10'],
    hazards: ['road block', 'ambulance stuck'],
    time_mentions: ['urgent'],
  },
  reasoning_summary: 'Approved text contains emergency route blockage and ambulance-delay signals.',
  privacy_status: 'user_approved_input_only',
  source: 'User report',
};

export function mockArtifactContent(filename: string): string {
  if (filename.endsWith('.md')) {
    return `# ${filename}\n\nMock fallback artifact. Start the CIRO backend to load live content.`;
  }
  return JSON.stringify({ filename, mock: true, note: 'Backend unavailable; mock fallback content.' }, null, 2);
}
