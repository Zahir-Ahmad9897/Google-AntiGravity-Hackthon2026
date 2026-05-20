import { Alert } from 'react-native';

import { ActionApprovalCard } from '../components/ActionApprovalCard';
import { InfoCard } from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { mockPipelineResult } from '../data/mockData';
import { approveAction, getLatestRunId, rejectAction, requestReplan } from '../services/api';
import { useAppState } from '../state/AppStateContext';

const fallbackActions = [
  'Reroute ambulance around blocked corridor.',
  'Generate simulated rescue alert.',
  'Mark unsafe road in CIRO dashboard.',
  'Create simulated public warning.',
  'Pre-position ambulance near alternate corridor.',
];

export function ActionApprovalScreen() {
  const { pipelineResult, actionDecisions, setActionDecision } = useAppState();
  const result = pipelineResult || mockPipelineResult;
  const finalTrace = result.iterations[result.iterations.length - 1];
  const actions = finalTrace.action_plan.length ? finalTrace.action_plan : fallbackActions;
  const runId = getLatestRunId();

  const approve = async (actionId: string) => {
    setActionDecision(await approveAction(runId, actionId));
  };

  const reject = async (actionId: string) => {
    setActionDecision(await rejectAction(runId, actionId));
  };

  const replan = async () => {
    const decision = await requestReplan(runId);
    setActionDecision(decision);
    Alert.alert('Re-plan requested', 'The request is recorded locally as a simulated officer decision.');
  };

  return (
    <Screen
      eyebrow="Approval"
      title="Simulated Actions"
      subtitle="Approve, reject, or request a re-plan for the current response plan."
    >
      <InfoCard accent="amber" title="Action Approval" subtitle="All listed actions remain simulated. Officer approval does not contact real services." />
      {actions.map((action, index) => {
        const actionId = `action-${index + 1}`;
        return (
          <ActionApprovalCard
            key={actionId}
            actionId={actionId}
            action={action}
            decision={actionDecisions[actionId]}
            onApprove={() => approve(actionId)}
            onReject={() => reject(actionId)}
          />
        );
      })}
      <PrimaryButton icon="refresh-outline" label="Request Re-plan" variant="secondary" onPress={replan} />
    </Screen>
  );
}
