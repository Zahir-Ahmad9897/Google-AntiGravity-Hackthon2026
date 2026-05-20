import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import ActionLogWidget from '../components/ActionLogWidget';
import { theme } from '../config/theme';
import { PipelineResult } from '../models/PipelineResult';

export default function ActionsScreen({ route }: any) {
  const { result } = route.params as { result: PipelineResult };
  const actions = useMemo(() => {
    const finalIteration = result.iterations[result.iterations.length - 1];
    return [
      ...finalIteration.action_plan,
      ...finalIteration.simulated_actions,
      finalIteration.next_step,
    ].filter(Boolean);
  }, [result]);

  return (
    <View style={styles.container}>
      <ActionLogWidget actions={actions} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.s16,
    backgroundColor: theme.colors.background,
  },
});
