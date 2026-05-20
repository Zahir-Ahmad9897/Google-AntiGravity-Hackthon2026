import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '../config/theme';
import { ActionItem, ActionStatus } from '../models/ActionItem';

const ACTION_LABELS: Record<string, string> = {
  reroute_traffic: 'Alternate route activated',
  dispatch_emergency: 'Emergency unit dispatched',
  send_alert: 'Public alert dispatched',
  open_shelter: 'Shelter readiness updated',
  monitor_only: 'Monitoring status retained',
};

const ICONS: Record<ActionStatus, string> = {
  completed: '✓',
  in_progress: '→',
  failed: '✗',
  warning: '⚠',
};

export default function ActionLogWidget({ actions }: { actions: string[] }) {
  const items = useMemo(() => buildItems(actions), [actions]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const timer = setInterval(() => {
      setVisibleCount((count) => {
        if (count >= items.length) {
          clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 250);

    return () => clearInterval(timer);
  }, [items]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {items.slice(0, visibleCount).map((item) => (
        <Animated.View entering={FadeInDown.duration(220)} key={item.id} style={styles.line}>
          <Text style={styles.text}>
            <Text style={[styles.icon, { color: statusColor(item.status) }]}>{ICONS[item.status]}</Text>
            {'  '}
            [{item.timestamp}] - {item.description}
          </Text>
        </Animated.View>
      ))}
      {visibleCount >= items.length && <Text style={styles.endText}>[ End of execution log ]</Text>}
    </ScrollView>
  );
}

function buildItems(actions: string[]): ActionItem[] {
  const source = actions.length ? actions : ['No simulated action emitted by the latest iteration.'];
  return source.map((action, index) => {
    const status: ActionStatus = action.toLowerCase().includes('await')
      ? 'in_progress'
      : action.toLowerCase().includes('failed')
        ? 'failed'
        : action.toLowerCase().includes('escalat')
          ? 'warning'
          : 'completed';
    const key = Object.keys(ACTION_LABELS).find((candidate) => action.includes(candidate));
    const description = key ? `${ACTION_LABELS[key]} - ${formatAction(action)}` : formatAction(action);

    return {
      id: `${index}-${action}`,
      description,
      status,
      timestamp: offsetTimestamp(index),
    };
  });
}

function formatAction(action: string) {
  return action
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function offsetTimestamp(offset: number) {
  const date = new Date(Date.now() + offset * 1000);
  return date.toLocaleTimeString('en-US', { hour12: false });
}

function statusColor(status: ActionStatus) {
  if (status === 'completed') return theme.colors.success;
  if (status === 'in_progress') return theme.colors.primary;
  if (status === 'failed') return theme.colors.danger;
  return theme.colors.warning;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.terminalBg,
  },
  content: {
    padding: theme.spacing.s16,
  },
  line: {
    marginBottom: theme.spacing.s8,
  },
  text: {
    color: theme.colors.terminalText,
    fontFamily: theme.typography.fontMono,
    fontSize: 12,
    lineHeight: 22,
  },
  icon: {
    fontFamily: theme.typography.fontBold,
  },
  endText: {
    marginTop: theme.spacing.s16,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontMono,
    fontSize: 12,
  },
});
