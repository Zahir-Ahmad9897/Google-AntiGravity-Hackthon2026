import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';

import { InfoCard } from '../components/InfoCard';
import { ReportForm } from '../components/ReportForm';
import { Screen } from '../components/Screen';
import { submitManualReport } from '../services/api';
import { useAppState } from '../state/AppStateContext';
import { colors } from '../theme/colors';
import type { ManualReport, MiniAssistantSignal } from '../types/api';
import type { MainTabParamList } from '../types/navigation';
import { percent } from '../utils/format';

type Props = BottomTabScreenProps<MainTabParamList, 'Report'>;

export function ManualReportScreen({ navigation }: Props) {
  const { setPipelineResult } = useAppState();
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<MiniAssistantSignal | undefined>();

  const submit = async (report: ManualReport) => {
    setLoading(true);
    const response = await submitManualReport(report);
    setSignal(response.signal);
    if (response.result) {
      setPipelineResult(response.result);
    }
    setLoading(false);
  };

  return (
    <Screen
      eyebrow="Signal"
      title="Manual Report"
      subtitle="Submit an officer-authorized event report and inspect Mini Assistant extraction."
    >
      <InfoCard
        accent="blue"
        title="Manual Emergency Report"
        subtitle="Officer-submitted content is treated as authorized emergency signal input. Optional image/audio is represented as a placeholder only."
      />
      <ReportForm onSubmit={submit} loading={loading} />
      {loading ? <ActivityIndicator color={colors.blue} /> : null}
      {signal ? (
        <InfoCard accent="green" title="Mini Assistant Extraction">
          <Text>Related: {signal.is_crisis_related ? 'Yes' : 'No'}</Text>
          <Text>Type: {signal.crisis_type}</Text>
          <Text>Urgency: {signal.urgency}</Text>
          <Text>Confidence: {percent(signal.confidence)}</Text>
          <Text>Privacy: {signal.privacy_status}</Text>
          <Text>{signal.reasoning_summary}</Text>
        </InfoCard>
      ) : null}
      {signal?.is_crisis_related ? (
        <InfoCard accent="violet" title="Custom Pipeline Ready">
          <Text>Custom CIRO run has been submitted. Open Pipeline, Trace, Approval, or Final to inspect results.</Text>
          <Text onPress={() => navigation.navigate('Pipeline')}>Open Pipeline</Text>
        </InfoCard>
      ) : null}
    </Screen>
  );
}
