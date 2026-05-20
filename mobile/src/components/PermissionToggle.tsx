import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function PermissionToggle({ label, description, value, onChange }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.row, value && styles.rowOn, pressed && styles.pressed]}
    >
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  rowOn: {
    backgroundColor: colors.greenSoft,
    borderColor: '#75e0a7',
  },
  pressed: {
    opacity: 0.9,
  },
  switch: {
    backgroundColor: '#cbd5e1',
    borderRadius: 999,
    height: 28,
    padding: 3,
    width: 52,
  },
  switchOn: {
    backgroundColor: colors.green,
  },
  knob: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    height: 22,
    width: 22,
  },
  knobOn: {
    transform: [{ translateX: 24 }],
  },
  copy: {
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
});
