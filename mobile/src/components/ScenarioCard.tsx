import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import type { ScenarioSummary } from '../types/api';

type Props = {
  scenario: ScenarioSummary;
  selected?: boolean;
  onPress: () => void;
};

export function ScenarioCard({ scenario, selected = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={[styles.iconShell, selected && styles.iconSelected]}>
          <Ionicons color={selected ? '#ffffff' : colors.blue} name={scenario.scenario_id.startsWith('custom-') ? 'create' : 'shield-checkmark'} size={18} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{scenario.title}</Text>
          <Text style={styles.risk}>{scenario.riskType}</Text>
        </View>
        {selected ? <Ionicons color={colors.green} name="checkmark-circle" size={22} /> : null}
      </View>
      <View style={styles.metaRow}>
        <Ionicons color={colors.muted} name="location-outline" size={14} />
        <Text style={styles.meta}>{scenario.location}</Text>
      </View>
      <Text style={styles.description}>{scenario.description}</Text>
      <Text style={styles.behavior}>{scenario.expectedAgentBehavior}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  selected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  pressed: {
    opacity: 0.9,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.blueSoft,
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  iconSelected: {
    backgroundColor: colors.blue,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  risk: {
    color: colors.amber,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  behavior: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
});
