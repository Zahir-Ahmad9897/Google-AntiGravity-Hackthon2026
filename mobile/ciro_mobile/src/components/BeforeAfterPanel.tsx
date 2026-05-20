import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { SCENARIO_METADATA } from '../config/appConfig';
import { theme, withAlpha } from '../config/theme';

const chartWidth = Dimensions.get('window').width - 64;

export default function BeforeAfterPanel({ scenarioId }: { scenarioId: string }) {
  const meta = SCENARIO_METADATA[scenarioId];
  if (!meta) {
    return null;
  }

  const before = meta.beforeState;
  const after = meta.afterState;

  const chartData = {
    labels: ['Block', 'Clear', 'Strand', 'Route', 'Units', 'Alert'],
    datasets: [{
      data: [
        before.roadsBlocked,
        after.roadsCleared,
        before.vehiclesStranded,
        after.vehiclesRerouted,
        after.unitsEnRoute,
        Math.round(after.usersAlerted / 100),
      ],
    }],
  };

  return (
    <View style={styles.card}>
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={[styles.header, styles.beforeHeader]}>BEFORE</Text>
          <Metric label="Roads blocked" value={before.roadsBlocked} tone="danger" />
          <Metric label="Vehicles stranded" value={before.vehiclesStranded} tone="danger" />
          <Metric label="Units deployed" value={before.unitsDeployed} tone="danger" />
          <Metric label="Users alerted" value={before.usersAlerted} tone="danger" />
        </View>
        <View style={styles.divider} />
        <View style={styles.column}>
          <Text style={[styles.header, styles.afterHeader]}>AFTER</Text>
          <Metric label="Roads cleared" value={after.roadsCleared} tone="success" />
          <Metric label="Vehicles rerouted" value={after.vehiclesRerouted} tone="success" />
          <Metric label="Units en route" value={after.unitsEnRoute} tone="success" />
          <Metric label="Users alerted" value={after.usersAlerted} tone="success" />
        </View>
      </View>

      <BarChart
        data={chartData}
        width={chartWidth}
        height={210}
        yAxisLabel=""
        yAxisSuffix=""
        fromZero
        showValuesOnTopOfBars
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => withAlpha(theme.colors.primary, opacity),
          labelColor: (opacity = 1) => withAlpha(theme.colors.textSecondary, opacity),
          barPercentage: 0.64,
          propsForBackgroundLines: {
            stroke: theme.colors.border,
          },
        }}
        style={styles.chart}
      />
    </View>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'danger' | 'success' }) {
  const color = tone === 'danger' ? theme.colors.danger : theme.colors.success;
  const mark = tone === 'danger' ? '●' : '↑';

  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value} {mark}</Text>
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
  columns: {
    flexDirection: 'row',
    marginBottom: theme.spacing.s16,
  },
  column: {
    flex: 1,
  },
  divider: {
    width: 1,
    marginHorizontal: theme.spacing.s16,
    backgroundColor: theme.colors.border,
  },
  header: {
    marginBottom: theme.spacing.s8,
    paddingBottom: theme.spacing.s4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  beforeHeader: {
    color: theme.colors.danger,
  },
  afterHeader: {
    color: theme.colors.success,
  },
  metricRow: {
    marginBottom: theme.spacing.s8,
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
  },
  metricValue: {
    marginTop: theme.spacing.s4,
    fontFamily: theme.typography.fontBold,
    fontSize: 14,
  },
  chart: {
    borderRadius: theme.borderRadius.sm,
  },
});
