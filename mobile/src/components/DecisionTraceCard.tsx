import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { IterationTrace } from '../types/api';
import { percent, titleCase } from '../utils/format';

type Props = {
  trace: IterationTrace;
};

export function DecisionTraceCard({ trace }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Iteration {trace.iteration_number} Decision Trace</Text>
      <Row label="Data sources" value={trace.input_sources.join(', ')} />
      <Row label="Confidence" value={percent(trace.confidence_score)} />
      <Row label="Crisis level" value={titleCase(trace.crisis_level)} />
      <Row label="Reasoning summary" value={trace.concise_reasoning_summary} />
      <Row label="Recommended action" value={trace.action_plan[0] || 'Monitor only'} />
      <Row label="Human approval" value={trace.approval_status} />
      <Row label="Next step" value={trace.next_step} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  row: {
    gap: 3,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
});
