import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { theme } from '../config/theme';

const TRACK_WIDTH = Math.max(0, Dimensions.get('window').width - theme.spacing.s32);

export default function ConfidenceMeter({ score }: { score: number }) {
  const normalized = Math.max(0, Math.min(1, score));
  const percent = Math.round(normalized * 100);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(percent, { duration: 900 });
  }, [percent, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: (TRACK_WIDTH * width.value) / 100,
  }));

  const fillColor = percent < 50
    ? theme.colors.success
    : percent < 80
      ? theme.colors.warning
      : theme.colors.danger;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Confidence</Text>
        <Text style={styles.value}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: fillColor }, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.s12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.s8,
  },
  label: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  value: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  track: {
    width: TRACK_WIDTH,
    height: 9,
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: theme.colors.surfaceLight,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});
