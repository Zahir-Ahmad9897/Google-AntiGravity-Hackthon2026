import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'neutral';
}>;

export function InfoCard({ accent = 'neutral', title, subtitle, children }: Props) {
  return (
    <View style={[styles.card, styles[accent]]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#101828',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  neutral: {},
  blue: {
    borderLeftColor: colors.blue,
    borderLeftWidth: 4,
  },
  green: {
    borderLeftColor: colors.green,
    borderLeftWidth: 4,
  },
  amber: {
    borderLeftColor: colors.amber,
    borderLeftWidth: 4,
  },
  red: {
    borderLeftColor: colors.red,
    borderLeftWidth: 4,
  },
  violet: {
    borderLeftColor: colors.violet,
    borderLeftWidth: 4,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  body: {
    gap: 10,
    marginTop: 10,
  },
});
