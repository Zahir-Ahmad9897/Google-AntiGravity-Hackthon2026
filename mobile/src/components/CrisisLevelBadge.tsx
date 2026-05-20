import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { titleCase } from '../utils/format';

type Props = {
  level?: string;
};

export function CrisisLevelBadge({ level = 'standby' }: Props) {
  const normalized = level.toLowerCase();
  const backgroundColor = normalized.includes('crisis')
    ? '#fee2e2'
    : normalized.includes('watch')
      ? '#fef3c7'
      : '#dcfce7';
  const color = normalized.includes('crisis') ? colors.red : normalized.includes('watch') ? colors.amber : colors.green;

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{titleCase(level)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '900',
  },
});
