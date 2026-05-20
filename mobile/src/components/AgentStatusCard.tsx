import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { AgentStepOutput } from '../types/api';
import { percent } from '../utils/format';

type Props = {
  agent: AgentStepOutput;
  status?: 'pending' | 'active' | 'completed';
  timestamp?: string;
};

export function AgentStatusCard({ agent, status = 'completed', timestamp }: Props) {
  const statusColor = status === 'active' ? colors.blue : status === 'completed' ? colors.green : colors.muted;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{agent.agent_name}</Text>
        <Text style={[styles.status, { color: statusColor }]}>{status.toUpperCase()}</Text>
      </View>
      <Text style={styles.label}>Input summary</Text>
      <Text style={styles.text}>{agent.reasoning_summary}</Text>
      <Text style={styles.label}>Output summary</Text>
      <Text style={styles.text}>{agent.summary}</Text>
      <View style={styles.footer}>
        <Text style={styles.confidence}>Confidence {percent(agent.confidence_score)}</Text>
        <Text style={styles.timestamp}>{timestamp || new Date().toLocaleTimeString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  status: {
    fontSize: 11,
    fontWeight: '900',
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  text: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confidence: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  timestamp: {
    color: colors.muted,
    fontSize: 12,
  },
});
