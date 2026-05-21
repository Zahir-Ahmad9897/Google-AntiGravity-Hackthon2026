import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapCanvasWidget from '../components/MapCanvasWidget';
import ToastRail from '../components/ToastRail';
import { theme } from '../config/theme';

export default function MapScreen({ route }: any) {
  const { result, scenarioId, showAfter = true } = route.params;
  const finalIteration = result?.iterations?.[result.iterations.length - 1];
  const locationHint = [
    result?.scenario_name,
    finalIteration?.concise_reasoning_summary,
  ].filter(Boolean).join(' ');
  return (
    <View style={styles.container}>
      <ToastRail messages={['Interactive map ready', 'Nearby POIs load at high zoom', 'Weather and danger overlays active']} />
      <MapCanvasWidget scenarioId={scenarioId} showAfter={showAfter} locationHint={locationHint} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
