import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme, withAlpha } from '../config/theme';

export default function ToastRail({ messages }: { messages: string[] }) {
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    setVisible([]);
    const timers = messages.map((message, index) => setTimeout(() => {
      setVisible((items) => [message, ...items].slice(0, 3));
    }, index * 700));
    return () => timers.forEach(clearTimeout);
  }, [messages]);

  return (
    <View pointerEvents="none" style={styles.rail}>
      {visible.map((message) => (
        <Animated.View entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(180)} key={message} style={styles.toast}>
          <Ionicons name="flash" size={14} color={theme.colors.primary} />
          <Text numberOfLines={2} style={styles.text}>{message}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    top: theme.spacing.s16,
    right: theme.spacing.s16,
    left: theme.spacing.s16,
    gap: theme.spacing.s8,
    zIndex: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s8,
    padding: theme.spacing.s12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.28),
    borderRadius: theme.borderRadius.md,
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
  },
  text: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
});
