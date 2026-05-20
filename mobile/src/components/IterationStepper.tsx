import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  currentIteration: number;
};

const loopSteps = ['Observe', 'Verify', 'Reason', 'Plan', 'Act', 'Evaluate', 'Re-plan'];

export function IterationStepper({ currentIteration }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iterations}>
        {[1, 2, 3].map((iteration) => (
          <View key={iteration} style={[styles.circle, iteration <= currentIteration && styles.circleActive]}>
            <Text style={[styles.circleText, iteration <= currentIteration && styles.circleTextActive]}>{iteration}</Text>
          </View>
        ))}
      </View>
      <View style={styles.steps}>
        {loopSteps.map((step) => (
          <Text key={step} style={styles.step}>
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  iterations: {
    flexDirection: 'row',
    gap: 12,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  circleActive: {
    backgroundColor: colors.blue,
  },
  circleText: {
    color: colors.muted,
    fontWeight: '900',
  },
  circleTextActive: {
    color: '#ffffff',
  },
  steps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  step: {
    backgroundColor: colors.surface2,
    borderRadius: 999,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
});
