import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../config/theme';

const STEPS = ['Select', 'Running', 'Results'];

export default function StepperWidget({ activeStep }: { activeStep: number }) {
  return (
    <View style={styles.container}>
      {STEPS.map((label, index) => {
        const step = index + 1;
        const active = step === activeStep;
        return (
          <View key={label} style={styles.step}>
            <View style={[styles.circle, active && styles.circleActive]}>
              <Text style={[styles.num, active && styles.numActive]}>{step}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            {index < STEPS.length - 1 && <View style={styles.line} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: theme.spacing.s20,
    paddingHorizontal: theme.spacing.s20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceLight,
  },
  circleActive: {
    backgroundColor: theme.colors.primary,
  },
  num: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  numActive: {
    color: theme.colors.background,
  },
  label: {
    marginLeft: theme.spacing.s8,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  labelActive: {
    color: theme.colors.primary,
  },
  line: {
    width: 30,
    height: 2,
    marginHorizontal: theme.spacing.s8,
    backgroundColor: theme.colors.surfaceLight,
  },
});
