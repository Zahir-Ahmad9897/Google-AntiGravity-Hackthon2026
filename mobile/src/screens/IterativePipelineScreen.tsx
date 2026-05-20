import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { InfoCard } from '../components/InfoCard';
import { IterationStepper } from '../components/IterationStepper';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { getPipelineStatus, runSelectedScenario } from '../services/api';
import { useAppState } from '../state/AppStateContext';
import { colors } from '../theme/colors';
import type { MainTabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Pipeline'>;

export function IterativePipelineScreen({ navigation }: Props) {
  const { selectedScenario, pipelineResult, setPipelineResult } = useAppState();
  const [loading, setLoading] = useState(false);
  const finalTrace = pipelineResult?.iterations[pipelineResult.iterations.length - 1];

  const run = async () => {
    if (!selectedScenario) {
      navigation.navigate('Scenarios');
      return;
    }
    setLoading(true);
    const result = await runSelectedScenario(selectedScenario);
    await getPipelineStatus();
    setPipelineResult(result);
    setLoading(false);
  };

  return (
    <Screen
      eyebrow="Pipeline"
      title="Iterative Response Loop"
      subtitle="Observe, verify, reason, plan, simulate, evaluate, and re-plan."
    >
      <InfoCard accent="blue" title="Iterative CIRO Pipeline" subtitle="Observe -> Verify -> Reason -> Plan -> Act -> Evaluate -> Re-plan">
        <IterationStepper currentIteration={finalTrace?.iteration_number || 0} />
      </InfoCard>
      <InfoCard accent="green" title="Progress State">
        <Text style={styles.text}>Scenario: {pipelineResult?.scenario_name || selectedScenario?.title || 'Not selected'}</Text>
        <Text style={styles.text}>Current active agent: {finalTrace?.agent_outputs.at(-1)?.agent_name || 'Awaiting run'}</Text>
        <Text style={styles.text}>Completed agents: {finalTrace?.agent_outputs.length || 0}</Text>
        <Text style={styles.text}>Iterations complete: {pipelineResult?.iterations.length || 0} / 3</Text>
      </InfoCard>
      {pipelineResult?.iterations.map((trace) => (
        <InfoCard key={trace.iteration_number} title={`Iteration ${trace.iteration_number}`}>
          <Text style={styles.text}>{trace.concise_reasoning_summary}</Text>
          <Text style={styles.meta}>{trace.evaluation_result}</Text>
        </InfoCard>
      ))}
      {loading ? <ActivityIndicator color={colors.blue} /> : null}
      <PrimaryButton icon="sync" label="Run Iterative Pipeline" onPress={run} disabled={loading} />
      <View style={styles.row}>
        <PrimaryButton icon="git-branch-outline" label="Agent Timeline" variant="secondary" onPress={() => navigation.navigate('Timeline')} />
        <PrimaryButton icon="analytics-outline" label="Decision Trace" variant="secondary" onPress={() => navigation.navigate('Trace')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  row: {
    gap: 8,
  },
});
