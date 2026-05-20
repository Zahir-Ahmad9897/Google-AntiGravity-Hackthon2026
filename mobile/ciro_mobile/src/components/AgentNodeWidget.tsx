import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../config/theme';

interface Props {
  agent: { id: number; name: string; icon: string };
  status: 'waiting' | 'running' | 'done' | 'flagged';
  summary?: string;
  timestamp?: string;
}

const statusLabel = {
  waiting: 'WAITING',
  running: 'RUNNING',
  done: 'DONE',
  flagged: 'FLAGGED',
};

export default function AgentNodeWidget({ agent, status, summary = '', timestamp = '' }: Props) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (status === 'running') {
      pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    } else {
      pulse.value = withTiming(0, { duration: 150 });
    }
  }, [pulse, status]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.18 }],
    opacity: 1 - pulse.value * 0.22,
  }));

  const statusColor = getStatusColor(status);

  return (
    <View style={styles.container}>
      <View style={styles.indexRail}>
        <Animated.View
          style={[
            styles.circle,
            { backgroundColor: statusColor, borderColor: statusColor },
            status === 'running' && pulseStyle,
          ]}
        >
          <Text style={styles.circleText}>{status === 'done' ? '✓' : status === 'flagged' ? '!' : agent.id}</Text>
        </Animated.View>
      </View>

      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.nameWrap}>
            <Text style={styles.agentIcon}>{agent.icon}</Text>
            <Text style={[styles.name, status === 'waiting' && styles.nameDim]} numberOfLines={1}>
              {agent.name}
            </Text>
          </View>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeBackground(status) }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel[status]}</Text>
        </View>
        <Text style={styles.summary}>{summary || 'Awaiting trace output...'}</Text>
      </View>
    </View>
  );
}

function getStatusColor(status: Props['status']) {
  if (status === 'done') return theme.colors.success;
  if (status === 'running') return theme.colors.primary;
  if (status === 'flagged') return theme.colors.danger;
  return theme.colors.textMuted;
}

function badgeBackground(status: Props['status']) {
  if (status === 'done') return theme.opacity.successPill;
  if (status === 'running') return theme.opacity.primaryPill;
  if (status === 'flagged') return theme.opacity.dangerPill;
  return theme.colors.surfaceLight;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: theme.spacing.s16,
  },
  indexRail: {
    width: 46,
    alignItems: 'center',
    paddingTop: theme.spacing.s8,
  },
  circle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 17,
  },
  circleText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
    fontSize: 13,
  },
  card: {
    flex: 1,
    padding: theme.spacing.s12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentIcon: {
    marginRight: theme.spacing.s8,
    fontSize: 16,
  },
  name: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 14,
  },
  nameDim: {
    color: theme.colors.textMuted,
  },
  timestamp: {
    marginLeft: theme.spacing.s8,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontMono,
    fontSize: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.s8,
    paddingHorizontal: theme.spacing.s8,
    paddingVertical: theme.spacing.s4,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
  },
  summary: {
    marginTop: theme.spacing.s8,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: 17,
  },
});
