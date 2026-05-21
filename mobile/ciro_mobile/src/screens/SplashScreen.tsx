import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../config/theme';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden in development or preview shells.
});

export default function SplashScreen({ navigation }: any) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
    const timer = setTimeout(() => {
      ExpoSplashScreen.hideAsync().catch(() => undefined);
      navigation.replace('Home');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + pulse.value * 0.4 }],
    opacity: 0.6 - pulse.value * 0.6,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Animated.View style={[styles.pulseCircle, pulseStyle]} />
        <Svg width={84} height={84} viewBox="0 0 24 24">
          <Path
            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 2.19 7 3.11V11c0 4.12-2.75 7.79-7 8.94C7.75 18.79 5 15.12 5 11V6.3l7-3.11Zm-1 12.06 6-6-1.41-1.41L11 12.42 8.41 9.84 7 11.25l4 4Z"
            fill={theme.colors.primary}
          />
        </Svg>
        <Text style={styles.title}>CIRO</Text>
        <Text style={styles.subtitle}>Crisis Intelligence & Response Orchestrator</Text>
      </View>
      <Text style={styles.footer}>Powered by Google ADK + Gemini 2.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: theme.colors.primary,
  },
  title: {
    marginTop: theme.spacing.s20,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontBold,
    fontSize: 42,
  },
  subtitle: {
    marginTop: theme.spacing.s8,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: theme.spacing.s48,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
  },
});
