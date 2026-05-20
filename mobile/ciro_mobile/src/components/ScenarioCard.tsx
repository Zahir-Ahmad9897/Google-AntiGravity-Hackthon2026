import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SCENARIO_METADATA } from '../config/appConfig';
import { theme } from '../config/theme';
import { Scenario } from '../models/Scenario';

interface Props {
  scenario: Scenario;
  onPress: () => void;
}

export default function ScenarioCard({ scenario, onPress }: Props) {
  const meta = SCENARIO_METADATA[scenario.scenario_id];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconGroup}>
          <Text style={styles.icon}>{meta?.icon ?? '⚠'}</Text>
          <View style={styles.typeChip}>
            <Text style={styles.typeText}>{meta?.crisisType ?? 'Crisis'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.title}>{meta?.displayName ?? scenario.title}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
        <Text style={styles.locationText}>{meta?.location ?? scenario.title}</Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>{meta?.description ?? scenario.description}</Text>

      <View style={styles.bottomRow}>
        <View style={styles.weatherPill}>
          <Text style={styles.weatherText}>{meta?.weather.condition ?? 'Simulated signals'}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.82}>
          <Text style={styles.buttonText}>LAUNCH</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.s16,
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
  },
  topRow: {
    marginBottom: theme.spacing.s8,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s12,
  },
  icon: {
    fontSize: 48,
  },
  typeChip: {
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.s4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
  },
  typeText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  title: {
    marginBottom: theme.spacing.s8,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s4,
    marginBottom: theme.spacing.s8,
  },
  locationText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
  },
  description: {
    marginBottom: theme.spacing.s16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherPill: {
    paddingHorizontal: theme.spacing.s8,
    paddingVertical: theme.spacing.s8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
  weatherText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
  },
  button: {
    paddingHorizontal: theme.spacing.s16,
    paddingVertical: theme.spacing.s12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
    fontSize: 13,
  },
});
