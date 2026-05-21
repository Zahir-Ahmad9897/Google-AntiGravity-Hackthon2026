import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, withAlpha } from '../config/theme';

export default function TacticalBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[theme.colors.background, '#09182A', theme.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.radarOne} />
      <View style={styles.radarTwo} />
      <View style={styles.grid} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  radarOne: {
    position: 'absolute',
    top: -110,
    right: -90,
    width: 260,
    height: 260,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.32),
    borderRadius: 130,
  },
  radarTwo: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 140,
    height: 140,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.success, 0.22),
    borderRadius: 70,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    backgroundColor: 'transparent',
    borderColor: withAlpha(theme.colors.primary, 0.28),
    borderWidth: 1,
  },
});
