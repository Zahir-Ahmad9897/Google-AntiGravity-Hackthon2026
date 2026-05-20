import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { InfoCard } from '../components/InfoCard';
import { PermissionToggle } from '../components/PermissionToggle';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useAppState } from '../state/AppStateContext';
import { colors } from '../theme/colors';
import type { PermissionState } from '../types/api';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Permissions'>;

export function PermissionScreen({ navigation }: Props) {
  const { permissions, setPermissions } = useAppState();

  const update = (key: keyof PermissionState, value: boolean) => {
    setPermissions({ ...permissions, [key]: value });
  };

  return (
    <Screen
      eyebrow="Privacy"
      title="Permission Setup"
      subtitle="Choose the contextual signals this demo session can use."
    >
      <InfoCard
        accent="green"
        title="Permission-Based Crisis Signal Reader"
        subtitle="CIRO Mini Assistant analyzes only emergency context intentionally approved by the officer. It does not secretly read screens, scrape social platforms, or monitor private content."
      >
        <Text style={styles.body}>Enable the contextual sources this field officer session is allowed to use.</Text>
      </InfoCard>
      <PermissionToggle
        label="Location context"
        description="Use officer-provided or scenario location context for map/risk summaries."
        value={permissions.locationContext}
        onChange={(value) => update('locationContext', value)}
      />
      <PermissionToggle
        label="Public emergency reports"
        description="Analyze approved public or pasted emergency reports only."
        value={permissions.publicEmergencyReports}
        onChange={(value) => update('publicEmergencyReports', value)}
      />
      <PermissionToggle
        label="Traffic/weather context"
        description="Use simulated or Google-backed traffic/weather context from CIRO backend."
        value={permissions.trafficWeatherContext}
        onChange={(value) => update('trafficWeatherContext', value)}
      />
      <PermissionToggle
        label="Manual reports"
        description="Allow officer-submitted manual reports to become authorized CIRO signals."
        value={permissions.manualReports}
        onChange={(value) => update('manualReports', value)}
      />
      <PrimaryButton icon="shield-checkmark-outline" label="Continue" onPress={() => navigation.replace('MainTabs')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
});
