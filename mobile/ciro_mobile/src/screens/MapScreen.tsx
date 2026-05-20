import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapCanvasWidget from '../components/MapCanvasWidget';
import { theme } from '../config/theme';

export default function MapScreen({ route }: any) {
  const { scenarioId, showAfter = true } = route.params;
  return (
    <View style={styles.container}>
      <MapCanvasWidget scenarioId={scenarioId} showAfter={showAfter} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
