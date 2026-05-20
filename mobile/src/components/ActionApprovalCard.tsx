import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { ActionDecision } from '../types/api';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  actionId: string;
  action: string;
  decision?: ActionDecision;
  onApprove: () => void;
  onReject: () => void;
};

export function ActionApprovalCard({ actionId, action, decision, onApprove, onReject }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.action}>{action}</Text>
      <Text style={styles.safety}>Simulation only. No real public alert, route update, or emergency dispatch is sent.</Text>
      {decision ? <Text style={styles.decision}>{decision.status.toUpperCase()}: {decision.note}</Text> : null}
      <View style={styles.buttons}>
        <PrimaryButton icon="checkmark-circle-outline" label="Approve Simulated Action" onPress={onApprove} />
        <PrimaryButton icon="close-circle-outline" label="Reject" variant="secondary" onPress={onReject} />
      </View>
      <Text style={styles.id}>Action ID: {actionId}</Text>
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
  action: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  safety: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  decision: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  buttons: {
    gap: 8,
  },
  id: {
    color: colors.muted,
    fontSize: 11,
  },
});
