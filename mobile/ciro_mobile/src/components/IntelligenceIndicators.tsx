import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, withAlpha } from '../config/theme';
import { IterationTrace } from '../models/PipelineResult';

export default function IntelligenceIndicators({ trace }: { trace: IterationTrace }) {
  const confidence = clamp01(trace.confidence_score);
  const risk = clamp01(trace.risk_score);
  const weatherImpact = /rain|flood|storm|weather/i.test(trace.concise_reasoning_summary) ? 0.82 : 0.32;
  const crowdRisk = /crowd|traffic|vehicle|road|blocked|congest/i.test(trace.concise_reasoning_summary) ? 0.74 : 0.46;
  const priority = Math.max(risk, confidence * 0.92);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>AI Intelligence</Text>
      <Metric label="Severity" value={risk} color={risk > 0.7 ? theme.colors.danger : theme.colors.warning} />
      <Metric label="Confidence" value={confidence} color={theme.colors.primary} />
      <Metric label="Crowd risk" value={crowdRisk} color={theme.colors.warning} />
      <Metric label="Weather impact" value={weatherImpact} color={theme.colors.primary} />
      <Metric label="Response priority" value={priority} color={theme.colors.success} />
    </View>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(value * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function clamp01(value: number) {
  if (value > 1) return Math.min(1, value / 100);
  return Math.max(0, Math.min(1, value || 0));
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.s12,
    marginBottom: theme.spacing.s16,
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.18),
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.opacity.glass,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 16,
  },
  metric: {
    gap: theme.spacing.s8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
  },
  metricValue: {
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  track: {
    height: 7,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: withAlpha(theme.colors.textMuted, 0.22),
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
