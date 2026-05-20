import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../config/theme';
import { IterationStatus, usePipelineStore } from '../store/pipelineStore';

export default function IterationTracker() {
  const { iterationStatus } = usePipelineStore();

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      {[1, 2, 3].map((iteration, index) => (
        <View key={iteration} style={styles.nodeContainer}>
          <Node status={iterationStatus[index]} />
          <Text style={[styles.label, iterationStatus[index] !== 'pending' && styles.labelActive]}>
            Iteration {iteration}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Node({ status }: { status: IterationStatus }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (status === 'running') {
      pulse.value = withRepeat(withTiming(1, { duration: 850 }), -1, true);
    } else {
      pulse.value = withTiming(0, { duration: 150 });
    }
  }, [pulse, status]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.35 }],
    opacity: 0.35 - pulse.value * 0.2,
  }));

  if (status === 'done') {
    return (
      <View style={[styles.circle, styles.doneCircle]}>
        <Text style={styles.check}>✓</Text>
      </View>
    );
  }

  if (status === 'running') {
    return (
      <View style={[styles.circle, styles.runningCircle]}>
        <Animated.View style={[styles.pulse, pulseStyle]} />
      </View>
    );
  }

  return <View style={[styles.circle, styles.pendingCircle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.s16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  nodeContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  line: {
    position: 'absolute',
    right: theme.spacing.s48,
    left: theme.spacing.s48,
    top: 25,
    height: 2,
    backgroundColor: theme.colors.surfaceLight,
  },
  circle: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  pendingCircle: {
    backgroundColor: theme.colors.surfaceLight,
  },
  runningCircle: {
    backgroundColor: theme.colors.primary,
  },
  doneCircle: {
    backgroundColor: theme.colors.success,
  },
  pulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },
  check: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
    fontSize: 11,
  },
  label: {
    marginTop: theme.spacing.s8,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: theme.colors.textPrimary,
  },
});
