import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ActionApprovalScreen } from '../screens/ActionApprovalScreen';
import { AgentTimelineScreen } from '../screens/AgentTimelineScreen';
import { ArtifactsScreen } from '../screens/ArtifactsScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { DecisionTraceScreen } from '../screens/DecisionTraceScreen';
import { FinalReportScreen } from '../screens/FinalReportScreen';
import { IterativePipelineScreen } from '../screens/IterativePipelineScreen';
import { ManualReportScreen } from '../screens/ManualReportScreen';
import { PermissionScreen } from '../screens/PermissionScreen';
import { ScenarioSelectorScreen } from '../screens/ScenarioSelectorScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { colors } from '../theme/colors';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '900' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Permissions" component={PermissionScreen} options={{ title: 'Permissions' }} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '900' },
        tabBarActiveTintColor: colors.blueDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800', letterSpacing: 0 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 66,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => <Ionicons color={color} name={iconFor(route.name)} size={size} />,
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Scenarios" component={ScenarioSelectorScreen} />
      <Tabs.Screen name="Pipeline" component={IterativePipelineScreen} />
      <Tabs.Screen name="Trace" component={DecisionTraceScreen} />
      <Tabs.Screen name="Approval" component={ActionApprovalScreen} />
      <Tabs.Screen name="Timeline" component={AgentTimelineScreen} options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="Artifacts" component={ArtifactsScreen} options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="Report" component={ManualReportScreen} options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="Final" component={FinalReportScreen} options={{ tabBarButton: () => null }} />
    </Tabs.Navigator>
  );
}

function iconFor(routeName: keyof MainTabParamList): keyof typeof Ionicons.glyphMap {
  const icons: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
    Dashboard: 'speedometer-outline',
    Scenarios: 'map-outline',
    Pipeline: 'git-branch-outline',
    Timeline: 'pulse-outline',
    Trace: 'analytics-outline',
    Approval: 'checkmark-done-circle-outline',
    Artifacts: 'folder-open-outline',
    Report: 'document-text-outline',
    Final: 'flag-outline',
  };
  return icons[routeName];
}
