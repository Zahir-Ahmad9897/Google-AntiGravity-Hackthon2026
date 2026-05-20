import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.logo}>
          <Ionicons color="#ffffff" name="shield-checkmark" size={28} />
        </View>
        <Text style={styles.brand}>CIRO</Text>
      </View>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Field Officer Console</Text>
        <Text style={styles.title}>Crisis Intelligence & Response Orchestrator</Text>
        <Text style={styles.tagline}>Simulation-only command workflow for scenario verification, iterative reasoning, and human-approved response planning.</Text>
      </View>
      <View style={styles.statusPanel}>
        <StatusItem icon="lock-closed-outline" label="Permission first" />
        <StatusItem icon="repeat-outline" label="Iterative pipeline" />
        <StatusItem icon="person-circle-outline" label="Human approval" />
      </View>
      <PrimaryButton icon="arrow-forward" label="Enter Console" onPress={() => navigation.navigate('Permissions')} />
    </View>
  );
}

function StatusItem({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.statusItem}>
      <Ionicons color={colors.cyan} name={icon} size={18} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy,
    flex: 1,
    gap: 22,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 42,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    position: 'absolute',
    top: 58,
    left: 24,
  },
  brand: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  hero: {
    gap: 12,
  },
  kicker: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 42,
  },
  tagline: {
    color: '#d0d5dd',
    fontSize: 15,
    lineHeight: 23,
  },
  statusPanel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  statusItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
