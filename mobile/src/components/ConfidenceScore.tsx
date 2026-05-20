import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { percent } from '../utils/format';

type Props = {
  value?: number;
  label?: string;
};

export function ConfidenceScore({ value = 0, label = 'Confidence' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{percent(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 130,
    padding: 12,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
});
