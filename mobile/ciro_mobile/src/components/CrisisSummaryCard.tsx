import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SCENARIO_METADATA } from '../config/appConfig';
import { theme } from '../config/theme';
import { IterationTrace } from '../models/PipelineResult';
import ConfidenceMeter from './ConfidenceMeter';

type CrisisLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export default function CrisisSummaryCard({ trace, scenarioId }: { trace: IterationTrace; scenarioId: string }) {
  const meta = SCENARIO_METADATA[scenarioId];
  const level = normalizeLevel(trace.crisis_level, trace.risk_score);
  const levelColor = getLevelColor(level);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (level === 'HIGH' || level === 'CRITICAL') {
      pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    }
  }, [level, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.04 }],
    opacity: 1 - pulse.value * 0.08,
  }));

  const impacts = [
    ...trace.action_plan.slice(0, 3),
    trace.evaluation_result,
  ].filter(Boolean);

  return (
    <View style={[styles.card, { borderLeftColor: levelColor }]}>
      <Text style={styles.title}>{meta?.displayName ?? trace.scenario_name}</Text>
      <Text style={styles.location}>📍 {meta?.location ?? trace.scenario_name}</Text>

      <ConfidenceMeter score={trace.confidence_score} />

      <View style={styles.levelRow}>
        <Animated.View
          style={[
            styles.levelBadge,
            { borderColor: levelColor, backgroundColor: badgeBackground(level) },
            (level === 'HIGH' || level === 'CRITICAL') && pulseStyle,
          ]}
        >
          <Text style={[styles.levelText, { color: levelColor }]}>{level}</Text>
        </Animated.View>
        <View style={styles.escalatedBadge}>
          <Text style={styles.escalatedText}>Escalated: {trace.crisis_level === 'crisis' ? 'YES' : 'NO'}</Text>
        </View>
      </View>

      <Text style={styles.explanation}>{trace.concise_reasoning_summary}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.impactRow}>
        {impacts.map((impact, index) => (
          <View key={`${impact}-${index}`} style={styles.impactChip}>
            <Text style={styles.impactText} numberOfLines={2}>{impact}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function normalizeLevel(raw: string, riskScore: number): CrisisLevel {
  if (riskScore >= 0.9) return 'CRITICAL';
  if (raw === 'crisis') return 'HIGH';
  if (raw === 'watchlist') return 'MEDIUM';
  return 'LOW';
}

function getLevelColor(level: CrisisLevel) {
  if (level === 'LOW') return theme.colors.success;
  if (level === 'MEDIUM') return theme.colors.warning;
  return theme.colors.danger;
}

function badgeBackground(level: CrisisLevel) {
  if (level === 'LOW') return theme.opacity.successPill;
  if (level === 'MEDIUM') return theme.opacity.warningPill;
  return theme.opacity.dangerPill;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.s16,
    padding: theme.spacing.s16,
    borderLeftWidth: 4,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 20,
  },
  location: {
    marginTop: theme.spacing.s4,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s8,
    marginBottom: theme.spacing.s12,
  },
  levelBadge: {
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.s4,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
  },
  levelText: {
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  escalatedBadge: {
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.s4,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surfaceLight,
  },
  escalatedText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  explanation: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  impactRow: {
    gap: theme.spacing.s8,
    paddingTop: theme.spacing.s12,
  },
  impactChip: {
    maxWidth: 240,
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.s8,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surfaceLight,
  },
  impactText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
  },
});
