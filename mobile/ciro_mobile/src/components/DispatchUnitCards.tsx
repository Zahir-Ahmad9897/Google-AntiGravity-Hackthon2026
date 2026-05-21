import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, withAlpha } from '../config/theme';
import { IterationTrace } from '../models/PipelineResult';

const UNITS = [
  { id: 'ambulance', label: 'Ambulance', icon: 'medical', eta: '6 min', color: theme.colors.success },
  { id: 'fire', label: 'Fire Brigade', icon: 'flame', eta: '9 min', color: theme.colors.danger },
  { id: 'police', label: 'Police', icon: 'shield-checkmark', eta: '4 min', color: theme.colors.primary },
] as const;

export default function DispatchUnitCards({ trace }: { trace: IterationTrace }) {
  const actionText = [...trace.action_plan, ...trace.simulated_actions].join(' ').toLowerCase();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Dispatch Board</Text>
        <Text style={styles.live}>LIVE</Text>
      </View>
      {UNITS.map((unit) => {
        const active = actionText.includes(unit.id) || actionText.includes('dispatch') || trace.crisis_level === 'crisis';
        return (
          <View key={unit.id} style={styles.unitRow}>
            <View style={[styles.iconBox, { backgroundColor: withAlpha(unit.color, 0.16) }]}>
              <Ionicons name={unit.icon as any} size={18} color={unit.color} />
            </View>
            <View style={styles.unitBody}>
              <Text style={styles.unitLabel}>{unit.label}</Text>
              <Text style={styles.unitMeta}>{active ? 'Dispatched' : 'Standing by'} - ETA {unit.eta}</Text>
            </View>
            <View style={[styles.statePill, { borderColor: active ? unit.color : theme.colors.border }]}>
              <Text style={[styles.stateText, { color: active ? unit.color : theme.colors.textMuted }]}>
                {active ? 'EN ROUTE' : 'READY'}
              </Text>
            </View>
          </View>
        );
      })}
      <View style={styles.routeStrip}>
        <Text style={styles.routeText}>Route condition</Text>
        <Text style={styles.routeValue}>Normal roads green - reroute corridor red</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.s12,
    marginBottom: theme.spacing.s16,
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.success, 0.18),
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.opacity.glass,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 16,
  },
  live: {
    paddingHorizontal: theme.spacing.s8,
    paddingVertical: theme.spacing.s4,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.success,
    backgroundColor: theme.opacity.successPill,
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s12,
  },
  iconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  unitBody: {
    flex: 1,
  },
  unitLabel: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 13,
  },
  unitMeta: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
  },
  statePill: {
    paddingHorizontal: theme.spacing.s8,
    paddingVertical: theme.spacing.s4,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
  },
  stateText: {
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
  },
  routeStrip: {
    padding: theme.spacing.s12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: withAlpha(theme.colors.background, 0.52),
  },
  routeText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBold,
    fontSize: 11,
  },
  routeValue: {
    marginTop: 2,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
  },
});
