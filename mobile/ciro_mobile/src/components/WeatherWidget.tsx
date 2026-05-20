import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SCENARIO_METADATA } from '../config/appConfig';
import { theme } from '../config/theme';

export default function WeatherWidget({ scenarioId }: { scenarioId: string }) {
  const weather = SCENARIO_METADATA[scenarioId]?.weather;
  if (!weather) {
    return null;
  }

  const icon = weather.condition.toLowerCase().includes('rain') || weather.condition.toLowerCase().includes('storm')
    ? '⛈'
    : '☀';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.mainText}>
          <Text style={styles.condition}>{weather.condition}</Text>
          <Text style={styles.temperature}>{weather.temperatureC}°C</Text>
        </View>
        <View style={styles.pills}>
          <Text style={styles.pill}>💧 {weather.rainfallMmHr}mm/hr</Text>
          <Text style={styles.pill}>💨 {weather.windKmh}km/h</Text>
        </View>
      </View>
      <View style={[styles.status, { backgroundColor: weather.isCrisisFactor ? theme.opacity.dangerPill : theme.opacity.successPill }]}>
        <Text style={[styles.statusText, { color: weather.isCrisisFactor ? theme.colors.danger : theme.colors.success }]}>
          {weather.isCrisisFactor ? '⚠ CONTRIBUTING TO CRISIS' : '✓ NORMAL'}
        </Text>
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
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: theme.spacing.s16,
    fontSize: 38,
  },
  mainText: {
    flex: 1,
  },
  condition: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontBold,
    fontSize: 14,
  },
  temperature: {
    marginTop: theme.spacing.s4,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 24,
  },
  pills: {
    alignItems: 'flex-end',
    gap: theme.spacing.s8,
  },
  pill: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
  },
  status: {
    alignItems: 'center',
    marginTop: theme.spacing.s16,
    paddingVertical: theme.spacing.s8,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
  },
});
