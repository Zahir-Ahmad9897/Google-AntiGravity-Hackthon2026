import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import ScenarioCard from '../components/ScenarioCard';
import StepperWidget from '../components/StepperWidget';
import { theme } from '../config/theme';
import { useScenarioStore } from '../store/scenarioStore';

export default function ScenarioSelectScreen({ navigation }: any) {
  const { scenarios, loading, error, loadScenarios, selectScenario } = useScenarioStore();
  const [reportText, setReportText] = useState('G-10 mein pani bhar gaya hai, gaariyan phans gayi hain');
  const [reportLocation, setReportLocation] = useState('G-10 Islamabad');
  const [severity, setSeverity] = useState<'Medium' | 'High' | 'Critical'>('High');
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [manualError, setManualError] = useState('');

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const handleLaunch = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectScenario(id);
    navigation.navigate('Pipeline', { scenarioId: id });
  };

  const handleManualLaunch = () => {
    const cleanText = reportText.trim();
    if (!cleanText) {
      setManualError('Enter a report before running the pipeline.');
      return;
    }
    if (!permissionGranted) {
      setManualError('Permission is required before CIRO can analyze user text.');
      return;
    }
    setManualError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Pipeline', {
      scenarioId: 'custom_permission_input',
      customReport: {
        text: cleanText,
        source: 'Mobile manual report',
        location: reportLocation.trim() || 'Unknown location',
        permission_granted: true,
        severity,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StepperWidget activeStep={1} />

      <View style={styles.manualCard}>
        <Text style={styles.manualTitle}>Run from user input</Text>
        <TextInput
          style={styles.reportInput}
          value={reportText}
          onChangeText={(value) => { setReportText(value); setManualError(''); }}
          multiline
          placeholder="Flash flood happening at George Town for past 30 mins"
          placeholderTextColor={theme.colors.textMuted}
        />
        <View style={styles.manualRow}>
          <TextInput
            style={[styles.locationInput, styles.field]}
            value={reportLocation}
            onChangeText={(value) => { setReportLocation(value); setManualError(''); }}
            placeholder="Location"
            placeholderTextColor={theme.colors.textMuted}
          />
          <View style={styles.severityRow}>
            {(['Medium', 'High', 'Critical'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.severityChip, severity === level && styles.severityChipActive]}
                onPress={() => setSeverity(level)}
              >
                <Text style={[styles.severityText, severity === level && styles.severityTextActive]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.permissionRow}>
          <Text style={styles.permissionText}>Analyze approved emergency text only</Text>
          <Switch
            value={permissionGranted}
            onValueChange={(value) => { setPermissionGranted(value); setManualError(''); }}
            thumbColor={permissionGranted ? theme.colors.primary : theme.colors.textMuted}
          />
        </View>
        {manualError ? <Text style={styles.manualError}>{manualError}</Text> : null}
        <TouchableOpacity style={styles.manualButton} onPress={handleManualLaunch}>
          <Text style={styles.manualButtonText}>Run Agent Pipeline</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      )}

      {!loading && error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Backend connection failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadScenarios}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={scenarios}
          keyExtractor={(item) => item.scenario_id}
          renderItem={({ item }) => (
            <ScenarioCard scenario={item} onPress={() => handleLaunch(item.scenario_id)} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

function SkeletonCard() {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, { duration: 900 }), -1, true);
  }, [opacity]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.skeletonCard, shimmerStyle]}>
      <View style={styles.skeletonTop} />
      <View style={styles.skeletonLineLarge} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLineShort} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.s16,
    paddingBottom: theme.spacing.s32,
  },
  errorCard: {
    margin: theme.spacing.s16,
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.opacity.dangerPill,
  },
  errorTitle: {
    marginBottom: theme.spacing.s8,
    color: theme.colors.danger,
    fontFamily: theme.typography.fontBold,
    fontSize: 16,
  },
  errorText: {
    marginBottom: theme.spacing.s12,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
  },
  retryButton: {
    alignItems: 'center',
    padding: theme.spacing.s12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.danger,
  },
  retryText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
  },
  manualCard: {
    margin: theme.spacing.s16,
    marginBottom: 0,
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  manualTitle: {
    marginBottom: theme.spacing.s12,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 16,
  },
  reportInput: {
    minHeight: 86,
    padding: theme.spacing.s12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  manualRow: {
    gap: theme.spacing.s8,
    marginTop: theme.spacing.s12,
  },
  field: {
    padding: theme.spacing.s12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
    fontFamily: theme.typography.fontFamily,
  },
  locationInput: {
    width: '100%',
  },
  severityRow: {
    flexDirection: 'row',
    gap: theme.spacing.s8,
  },
  severityChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.s8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
  severityChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  severityText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  severityTextActive: {
    color: theme.colors.background,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.s12,
  },
  permissionText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
  },
  manualError: {
    marginTop: theme.spacing.s8,
    color: theme.colors.danger,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  manualButton: {
    alignItems: 'center',
    marginTop: theme.spacing.s12,
    padding: theme.spacing.s12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  manualButtonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
    fontSize: 13,
  },
  skeletonCard: {
    height: 174,
    marginBottom: theme.spacing.s16,
    padding: theme.spacing.s16,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
  skeletonTop: {
    width: 72,
    height: 36,
    marginBottom: theme.spacing.s16,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
  skeletonLineLarge: {
    width: '70%',
    height: 18,
    marginBottom: theme.spacing.s12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
  skeletonLine: {
    width: '90%',
    height: 12,
    marginBottom: theme.spacing.s8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
  skeletonLineShort: {
    width: '52%',
    height: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
  },
});
