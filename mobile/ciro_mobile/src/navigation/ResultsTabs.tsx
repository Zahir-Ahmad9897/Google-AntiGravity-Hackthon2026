import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ActionsScreen from '../screens/ActionsScreen';
import MapScreen from '../screens/MapScreen';
import ReportScreen from '../screens/ReportScreen';
import ResultsSummaryScreen from '../screens/ResultsSummaryScreen';
import { PipelineResult } from '../models/PipelineResult';
import { theme } from '../config/theme';

export type ResultsTabParamList = {
  Summary: { result: PipelineResult; scenarioId: string };
  Map: { result: PipelineResult; scenarioId: string; showAfter: boolean };
  Actions: { result: PipelineResult; scenarioId: string };
  Report: { result: PipelineResult; scenarioId: string };
};

const Tab = createBottomTabNavigator<ResultsTabParamList>();

const TAB_ICONS: Record<keyof ResultsTabParamList, string> = {
  Summary: '🎯',
  Map: '🗺',
  Actions: '⚡',
  Report: '📋',
};

export default function ResultsTabs({ result, scenarioId }: { result: PipelineResult; scenarioId: string }) {
  return (
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
          <Text style={{ color, fontSize: 18 }}>{TAB_ICONS[route.name as keyof ResultsTabParamList]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Summary" component={ResultsSummaryScreen} initialParams={{ result, scenarioId }} />
      <Tab.Screen name="Map" component={MapScreen} initialParams={{ result, scenarioId, showAfter: true }} />
      <Tab.Screen name="Actions" component={ActionsScreen} initialParams={{ result, scenarioId }} />
      <Tab.Screen name="Report" component={ReportScreen} initialParams={{ result, scenarioId }} />
    </Tab.Navigator>
  );
}
