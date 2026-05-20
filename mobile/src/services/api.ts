import { mockArtifactContent, mockArtifacts, mockMiniAssistantSignal, mockPipelineResult, mockScenarios } from '../data/mockData';
import type {
  ActionDecision,
  ArtifactInfo,
  IterationTrace,
  ManualReport,
  MiniAssistantSignal,
  PipelineResult,
  ScenarioSummary,
} from '../types/api';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8080';
const API_BASE_URL = process.env.EXPO_PUBLIC_CIRO_API_URL || DEFAULT_BASE_URL;

const localActionDecisions = new Map<string, ActionDecision>();
let latestRun: PipelineResult | null = null;
let latestRunId = 'local-demo-run';

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function getScenarios(): Promise<ScenarioSummary[]> {
  try {
    const scenarios = await requestJson<Array<Record<string, unknown>>>('/api/iterative/scenarios');
    return scenarios.map(normalizeScenario);
  } catch {
    return mockScenarios;
  }
}

export async function runScenario(scenarioId: string): Promise<PipelineResult> {
  try {
    latestRun = await requestJson<PipelineResult>('/api/iterative/run', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    latestRunId = `${scenarioId}-${Date.now()}`;
    return latestRun;
  } catch {
    latestRun = { ...mockPipelineResult, scenario_id: scenarioId };
    latestRunId = `mock-${scenarioId}-${Date.now()}`;
    return latestRun;
  }
}

export async function runSelectedScenario(scenario: ScenarioSummary): Promise<PipelineResult> {
  if (!scenario.customText) {
    return runScenario(scenario.scenario_id);
  }

  try {
    latestRun = await requestJson<PipelineResult>('/api/iterative/run-custom', {
      method: 'POST',
      body: JSON.stringify({
        text: scenario.customText,
        source: 'Field officer custom scenario',
        location: scenario.location,
        severity: scenario.urgency || 'High',
        permission_granted: true,
      }),
    });
    latestRunId = `${scenario.scenario_id}-${Date.now()}`;
    return latestRun;
  } catch {
    latestRun = {
      ...mockPipelineResult,
      description: scenario.description,
      scenario_id: scenario.scenario_id,
      scenario_name: scenario.title,
      mini_assistant_summary: `Custom scenario accepted locally: ${scenario.customText}`,
    };
    latestRunId = `mock-${scenario.scenario_id}-${Date.now()}`;
    return latestRun;
  }
}

export async function getPipelineStatus(runId = latestRunId): Promise<{ runId: string; status: string; currentIteration: number; currentAgent: string }> {
  const result = latestRun || mockPipelineResult;
  const trace = result.iterations[result.iterations.length - 1];
  const latestAgent = trace.agent_outputs[trace.agent_outputs.length - 1]?.agent_name || 'Evaluation/Replanning Agent';
  return {
    runId,
    status: 'completed',
    currentIteration: trace.iteration_number,
    currentAgent: latestAgent,
  };
}

export async function getDecisionTrace(): Promise<IterationTrace> {
  const result = latestRun || mockPipelineResult;
  return result.iterations[result.iterations.length - 1];
}

export async function getAgentTimeline(): Promise<IterationTrace[]> {
  return (latestRun || mockPipelineResult).iterations;
}

export async function getArtifacts(): Promise<ArtifactInfo[]> {
  try {
    return await requestJson<ArtifactInfo[]>('/api/artifacts');
  } catch {
    return mockArtifacts;
  }
}

export async function getArtifactContent(filename: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/artifacts/${encodeURIComponent(filename)}`);
    if (!response.ok) throw new Error(`Unable to read artifact ${filename}`);
    return response.text();
  } catch {
    return mockArtifactContent(filename);
  }
}

export async function approveAction(runId: string, actionId: string): Promise<ActionDecision> {
  return rememberAction(runId, actionId, 'approved', 'Officer approved simulated action locally.');
}

export async function rejectAction(runId: string, actionId: string): Promise<ActionDecision> {
  return rememberAction(runId, actionId, 'rejected', 'Officer rejected simulated action locally.');
}

export async function requestReplan(runId: string): Promise<ActionDecision> {
  return rememberAction(runId, 'replan', 'replan_requested', 'Officer requested simulated re-plan locally.');
}

export async function submitManualReport(report: ManualReport): Promise<{ signal: MiniAssistantSignal; result?: PipelineResult }> {
  if (!report.permissionGranted) {
    return {
      signal: {
        ...mockMiniAssistantSignal,
        is_crisis_related: false,
        confidence: 0,
        reasoning_summary: 'Permission was not granted, so CIRO did not analyze the report.',
        privacy_status: 'permission_required',
      },
    };
  }

  try {
    const result = await requestJson<PipelineResult>('/api/iterative/run-custom', {
      method: 'POST',
      body: JSON.stringify({
        text: `${report.eventType}: ${report.description}`,
        source: report.source,
        location: report.location,
        severity: report.urgency,
        permission_granted: report.permissionGranted,
      }),
    });
    latestRun = result;
    latestRunId = `custom-${Date.now()}`;
    return {
      signal: await getLatestMiniAssistantSignal(report),
      result,
    };
  } catch {
    latestRun = mockPipelineResult;
    latestRunId = `mock-custom-${Date.now()}`;
    return {
      signal: { ...mockMiniAssistantSignal, location: report.location, source: report.source },
      result: latestRun,
    };
  }
}

export function getLatestRun(): PipelineResult {
  return latestRun || mockPipelineResult;
}

export function getLatestRunId(): string {
  return latestRunId;
}

export function getActionDecision(actionId: string): ActionDecision | undefined {
  return localActionDecisions.get(actionId);
}

function rememberAction(runId: string, actionId: string, status: ActionDecision['status'], note: string): ActionDecision {
  const decision = { actionId, status, note: `${note} Run: ${runId}` };
  localActionDecisions.set(actionId, decision);
  return decision;
}

async function getLatestMiniAssistantSignal(report: ManualReport): Promise<MiniAssistantSignal> {
  try {
    return await requestJson<MiniAssistantSignal>('/api/mini-assistant/extract', {
      method: 'POST',
      body: JSON.stringify({
        text: `${report.eventType}: ${report.description}`,
        source: report.source,
        location: report.location,
        permission_granted: report.permissionGranted,
      }),
    });
  } catch {
    return { ...mockMiniAssistantSignal, location: report.location, source: report.source };
  }
}

function normalizeScenario(raw: Record<string, unknown>): ScenarioSummary {
  const scenarioId = String(raw.scenario_id || '');
  const title = String(raw.title || scenarioId);
  const description = String(raw.description || '');
  const location = inferLocation(scenarioId, title);
  return {
    scenario_id: scenarioId,
    title,
    description,
    location,
    riskType: inferRiskType(scenarioId, title),
    expectedAgentBehavior: inferAgentBehavior(scenarioId),
  };
}

function inferLocation(scenarioId: string, title: string): string {
  const combined = `${scenarioId} ${title}`.toLowerCase();
  if (combined.includes('peshawar')) return 'Peshawar Ring Road';
  if (combined.includes('ambulance')) return 'G-10 to PIMS Islamabad';
  return 'G-10 Islamabad';
}

function inferRiskType(scenarioId: string, title: string): string {
  const combined = `${scenarioId} ${title}`.toLowerCase();
  if (combined.includes('blast')) return 'Blast / road blockage';
  if (combined.includes('ambulance')) return 'Ambulance delay';
  return 'Urban flooding';
}

function inferAgentBehavior(scenarioId: string): string {
  if (scenarioId.includes('peshawar')) return 'Verify public blast reports and reroute around sealed road.';
  if (scenarioId.includes('ambulance')) return 'Correlate rain and congestion, then simulate emergency reroute.';
  return 'Correlate rain, traffic, and public reports, then simulate rescue planning.';
}
