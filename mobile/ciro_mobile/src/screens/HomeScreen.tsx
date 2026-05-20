import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';

export default function HomeScreen({ navigation }: any) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLaunch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Scenarios');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[theme.colors.surface, theme.colors.background]} style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.logoArea}>
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
            <Text style={styles.logoText}>CIRO</Text>
          </View>
          <View style={styles.rightArea}>
            <Text style={styles.clock}>{time.toLocaleTimeString('en-US', { hour12: false })}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} accessibilityLabel="Open settings">
              <Ionicons name="settings-outline" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statusBanner}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>SYSTEM ACTIVE - All agents ready</Text>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Crisis Intelligence</Text>
            <Text style={styles.heroSubtitle}>Real-time multi-agent response orchestration</Text>
            <View style={styles.adkBadge}>
              <Text style={styles.adkBadgeText}>Powered by Google ADK</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text style={styles.statNum}>9</Text>
              <Text style={styles.statLabel}>Agents Active</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="map" size={20} color={theme.colors.warning} />
              <Text style={styles.statNum}>3</Text>
              <Text style={styles.statLabel}>Scenarios</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="hardware-chip" size={20} color={theme.colors.success} />
              <Text style={styles.statNum}>2.0</Text>
              <Text style={styles.statLabel}>Gemini</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleLaunch} activeOpacity={0.86}>
            <Text style={styles.actionButtonText}>LAUNCH CRISIS RESPONSE</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.footer}>Simulation only - No real emergency services contacted</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.s16,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s8,
  },
  logoText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 20,
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s16,
  },
  clock: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontMono,
    fontSize: 16,
  },
  scrollContent: {
    alignItems: 'center',
    padding: theme.spacing.s20,
    paddingBottom: theme.spacing.s48,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s32,
    paddingHorizontal: theme.spacing.s16,
    paddingVertical: theme.spacing.s8,
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.opacity.successPill,
  },
  statusDot: {
    width: 8,
    height: 8,
    marginRight: theme.spacing.s8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  statusText: {
    color: theme.colors.success,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.s48,
  },
  heroTitle: {
    marginBottom: theme.spacing.s8,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 32,
    textAlign: 'center',
  },
  heroSubtitle: {
    marginBottom: theme.spacing.s16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    textAlign: 'center',
  },
  adkBadge: {
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.s4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
  adkBadgeText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.s12,
    width: '100%',
    marginBottom: theme.spacing.s48,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  statNum: {
    marginVertical: theme.spacing.s4,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 24,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: theme.spacing.s16,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.elevated,
  },
  actionButtonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
    fontSize: 16,
  },
  footer: {
    marginBottom: theme.spacing.s20,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    textAlign: 'center',
  },
});
