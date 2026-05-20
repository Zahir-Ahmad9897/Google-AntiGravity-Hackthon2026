import { StyleSheet, Text } from 'react-native';

import { CrisisLevelBadge } from '../components/CrisisLevelBadge';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { mockPipelineResult } from '../data/mockData';
import { useAppState } from '../state/AppStateContext';
import { colors } from '../theme/colors';
import { artifactFilename } from '../utils/format';

export function FinalReportScreen() {
  const { pipelineResult } = useAppState();
  const result = pipelineResult || mockPipelineResult;
  const finalTrace = result.iterations[result.iterations.length - 1];

  return (
    <Screen
      eyebrow="Report"
      title="Final Summary"
      subtitle="Review the outcome of the latest CIRO pipeline run."
    >
      <InfoCard accent="green" title="Final Crisis Report" subtitle="Summary of the latest CIRO pipeline run. All actions are simulated.">
        <CrisisLevelBadge level={result.final_crisis_level} />
        <Text style={styles.title}>{result.scenario_name}</Text>
        <Text style={styles.text}>{finalTrace.evaluation_result}</Text>
      </InfoCard>
      <InfoCard accent="blue" title="Final Plan">
        {finalTrace.action_plan.map((line) => (
          <Text key={line} style={styles.text}>- {line}</Text>
        ))}
      </InfoCard>
      <InfoCard accent="amber" title="Actions Simulated">
        {finalTrace.simulated_actions.map((line) => (
          <Text key={line} style={styles.text}>- {line}</Text>
        ))}
      </InfoCard>
      <InfoCard title="Approval And Artifacts">
        <Text style={styles.text}>Approval: {result.human_approval.approval_status}</Text>
        <Text style={styles.text}>Artifacts generated: {result.artifact_files.length}</Text>
        {result.artifact_files.slice(0, 8).map((file) => (
          <Text key={file} style={styles.artifact}>- {artifactFilename(file)}</Text>
        ))}
      </InfoCard>
      <InfoCard title="Report Content">
        <Text style={styles.report}>{result.final_crisis_report}</Text>
      </InfoCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  text: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  artifact: {
    color: colors.blue,
    fontSize: 12,
    lineHeight: 18,
  },
  report: {
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
