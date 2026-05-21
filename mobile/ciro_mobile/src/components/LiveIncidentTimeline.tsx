import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme, withAlpha } from '../config/theme';
import { IterationTrace } from '../models/PipelineResult';

const DEFAULT_EVENTS = [
  'Incident detected',
  'Crowd and road risk elevated',
  'Weather and traffic signals checked',
  'Ambulance route optimized',
  'Alternate route generated',
  'Public alert prepared',
];

export default function LiveIncidentTimeline({ trace }: { trace?: IterationTrace }) {
  const scrollRef = useRef<ScrollView>(null);
  const events = useMemo(() => {
    if (!trace) return DEFAULT_EVENTS;
    return [
      'Incident detected',
      trace.concise_reasoning_summary,
      ...trace.action_plan.slice(0, 3),
      ...trace.simulated_actions.slice(0, 2),
      trace.next_step,
    ].filter(Boolean);
  }, [trace]);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    const timer = setInterval(() => {
      setVisible((count) => {
        if (count >= events.length) {
          clearInterval(timer);
          return count;
        }
        return count + 1;
      });
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }, 280);
    return () => clearInterval(timer);
  }, [events]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Incident Timeline</Text>
        <Text style={styles.count}>{Math.min(visible, events.length)}/{events.length}</Text>
      </View>
      <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
        {events.slice(0, visible).map((event, index) => {
          const isCurrent = index === visible - 1 && visible < events.length;
          return (
            <Animated.View entering={FadeInDown.duration(220)} key={`${event}-${index}`} style={styles.row}>
              <View style={[styles.dot, isCurrent && styles.dotCurrent]}>
                <Ionicons name={isCurrent ? 'radio-button-on' : 'checkmark'} size={12} color={isCurrent ? theme.colors.primary : theme.colors.success} />
              </View>
              <View style={styles.body}>
                <Text style={styles.time}>{eventTime(index)}</Text>
                <Text style={styles.event} numberOfLines={3}>{event}</Text>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function eventTime(index: number) {
  const date = new Date(Date.now() + index * 45000);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  card: {
    maxHeight: 260,
    marginBottom: theme.spacing.s16,
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.18),
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.opacity.glass,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.s12,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 16,
  },
  count: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  scroll: {
    maxHeight: 198,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.s12,
    paddingBottom: theme.spacing.s12,
  },
  dot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.success, 0.4),
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.success, 0.1),
  },
  dotCurrent: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.opacity.primaryPill,
  },
  body: {
    flex: 1,
    paddingBottom: theme.spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(theme.colors.border, 0.55),
  },
  time: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
  },
  event: {
    marginTop: 2,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: 17,
  },
});
