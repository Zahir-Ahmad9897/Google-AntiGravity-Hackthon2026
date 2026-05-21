import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ActionLogWidget from '../components/ActionLogWidget';
import DispatchUnitCards from '../components/DispatchUnitCards';
import IntelligenceIndicators from '../components/IntelligenceIndicators';
import TacticalBackground from '../components/TacticalBackground';
import ToastRail from '../components/ToastRail';
import { theme } from '../config/theme';
import { PipelineResult } from '../models/PipelineResult';

export default function ActionsScreen({ route }: any) {
  const { result } = route.params as { result: PipelineResult };
  const finalIteration = result.iterations[result.iterations.length - 1];
  const actions = useMemo(() => {
    return [
      ...finalIteration.action_plan,
      ...finalIteration.simulated_actions,
      finalIteration.next_step,
    ].filter(Boolean);
  }, [finalIteration]);

  return (
    <TacticalBackground>
      <ToastRail messages={['Route updated', 'Unit dispatched', 'Public alert prepared']} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <DispatchUnitCards trace={finalIteration} />
        <IntelligenceIndicators trace={finalIteration} />
        <ActionLogWidget actions={actions} />
      </ScrollView>
    </TacticalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.transparent,
  },
  content: {
    padding: theme.spacing.s16,
    paddingTop: 88,
    paddingBottom: theme.spacing.s48,
    minHeight: '100%',
  },
});
