import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ConfidenceScore } from '../components/ConfidenceScore';
import { CrisisLevelBadge } from '../components/CrisisLevelBadge';
import { InfoCard } from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { getApiBaseUrl, runSelectedScenario } from '../services/api';
import { useAppState } from '../state/AppStateContext';
import { colors } from '../theme/colors';
import type { MainTabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { selectedScenario, pipelineResult, setPipelineResult } = useAppState();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!selectedScenario) {
      navigation.navigate('Scenarios');
      return;
    }
    setLoading(true);
    const result = await runSelectedScenario(selectedScenario);
    setPipelineResult(result);
    setLoading(false);
    navigation.navigate('Pipeline');
  };

  return (
    <Screen
      eyebrow="Command"
      title="Operations Dashboard"
      subtitle="Run scenarios, monitor confidence, and move through the CIRO response loop."
    >
      <InfoCard accent="blue" title="Current System Status" subtitle={`Backend: ${getApiBaseUrl()} with mock fallback if unavailable.`}>
        <View style={styles.row}>
          <CrisisLevelBadge level={pipelineResult?.final_crisis_level || 'standby'} />
          <Text style={styles.status}>{pipelineResult ? 'Latest run complete' : 'Awaiting scenario run'}</Text>
        </View>
      </InfoCard>
      <InfoCard accent="violet" title="Active Scenario">
        <Text style={styles.value}>{selectedScenario?.title || 'No scenario selected'}</Text>
        <Text style={styles.meta}>{selectedScenario?.location || 'Select one from Scenarios.'}</Text>
      </InfoCard>
      <View style={styles.metrics}>
        <ConfidenceScore label="Confidence" value={pipelineResult?.final_confidence_score || 0} />
        <ConfidenceScore label="Risk Score" value={pipelineResult?.risk_score.final_score || 0} />
      </View>
      {loading ? <ActivityIndicator color={colors.blue} /> : null}
      <PrimaryButton icon="play" label="Run Pipeline" onPress={run} disabled={loading} />
      <PrimaryButton icon="folder-open-outline" label="View Artifacts" variant="secondary" onPress={() => navigation.navigate('Artifacts')} />
      <PrimaryButton icon="document-text-outline" label="Submit Report" variant="secondary" onPress={() => navigation.navigate('Report')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  status: {
    color: colors.text,
    flex: 1,
    fontWeight: '700',
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
