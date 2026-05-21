import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ActionsScreen from '../screens/ActionsScreen';
import MapScreen from '../screens/MapScreen';
import ReportScreen from '../screens/ReportScreen';
import ResultsSummaryScreen from '../screens/ResultsSummaryScreen';
import { PipelineResult } from '../models/PipelineResult';
import { theme } from '../config/theme';
import { usePipelineStore } from '../store/pipelineStore';

export type ResultsTabParamList = {
  Summary: { result: PipelineResult; scenarioId: string };
  Map: { result: PipelineResult; scenarioId: string; showAfter: boolean };
  Actions: { result: PipelineResult; scenarioId: string };
  Report: { result: PipelineResult; scenarioId: string };
};

const Tab = createBottomTabNavigator<ResultsTabParamList>();

const TAB_ICONS: Record<keyof ResultsTabParamList, keyof typeof Ionicons.glyphMap> = {
  Summary: 'analytics',
  Map: 'map',
  Actions: 'flash',
  Report: 'document-text',
};

export default function ResultsTabs({ result, scenarioId }: { result: PipelineResult; scenarioId: string }) {
  const navigation = useNavigation<any>();
  const resetPipeline = usePipelineStore((state) => state.reset);

  const runAnother = () => {
    resetPipeline();
    navigation.reset({ index: 0, routes: [{ name: 'Scenarios' }] });
  };

  const backHome = () => {
    resetPipeline();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={styles.shell}>
      <View style={styles.commandBar}>
        <View style={styles.commandText}>
          <Text style={styles.commandEyebrow}>Scenario Complete</Text>
          <Text numberOfLines={1} style={styles.commandTitle}>{result.scenario_name}</Text>
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={backHome}>
          <Ionicons name="home" size={14} color={theme.colors.textPrimary} />
          <Text style={styles.secondaryText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={runAnother}>
          <Ionicons name="refresh" size={14} color={theme.colors.background} />
          <Text style={styles.primaryText}>Run Another</Text>
        </TouchableOpacity>
      </View>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            height: 64,
            paddingBottom: theme.spacing.s8,
            paddingTop: theme.spacing.s8,
          },
          tabBarLabelStyle: {
            fontFamily: theme.typography.fontBold,
            fontSize: 11,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarIcon: ({ color }) => (
            <Ionicons name={TAB_ICONS[route.name as keyof ResultsTabParamList]} size={20} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Summary" component={ResultsSummaryScreen} initialParams={{ result, scenarioId }} />
        <Tab.Screen name="Map" component={MapScreen} initialParams={{ result, scenarioId, showAfter: true }} />
        <Tab.Screen name="Actions" component={ActionsScreen} initialParams={{ result, scenarioId }} />
        <Tab.Screen name="Report" component={ReportScreen} initialParams={{ result, scenarioId }} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  commandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s8,
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  commandText: {
    flex: 1,
    minWidth: 0,
  },
  commandEyebrow: {
    color: theme.colors.success,
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  commandTitle: {
    marginTop: 2,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 13,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s4,
    paddingHorizontal: theme.spacing.s8,
    paddingVertical: theme.spacing.s8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
  },
  secondaryText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 11,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s4,
    paddingHorizontal: theme.spacing.s8,
    paddingVertical: theme.spacing.s8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  primaryText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
    fontSize: 11,
  },
});
