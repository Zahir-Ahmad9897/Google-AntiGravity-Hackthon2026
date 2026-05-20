import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import type { ActionDecision, PermissionState, PipelineResult, ScenarioSummary } from '../types/api';

type AppStateValue = {
  permissions: PermissionState;
  selectedScenario?: ScenarioSummary;
  pipelineResult?: PipelineResult;
  actionDecisions: Record<string, ActionDecision>;
  setPermissions: (permissions: PermissionState) => void;
  setSelectedScenario: (scenario: ScenarioSummary) => void;
  setPipelineResult: (result: PipelineResult) => void;
  setActionDecision: (decision: ActionDecision) => void;
};

const defaultPermissions: PermissionState = {
  locationContext: false,
  publicEmergencyReports: false,
  trafficWeatherContext: false,
  manualReports: false,
};

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioSummary | undefined>();
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | undefined>();
  const [actionDecisions, setActionDecisions] = useState<Record<string, ActionDecision>>({});

  const value = useMemo<AppStateValue>(
    () => ({
      permissions,
      selectedScenario,
      pipelineResult,
      actionDecisions,
      setPermissions,
      setSelectedScenario,
      setPipelineResult,
      setActionDecision: (decision) =>
        setActionDecisions((current) => ({
          ...current,
          [decision.actionId]: decision,
        })),
    }),
    [actionDecisions, permissions, pipelineResult, selectedScenario],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return value;
}
