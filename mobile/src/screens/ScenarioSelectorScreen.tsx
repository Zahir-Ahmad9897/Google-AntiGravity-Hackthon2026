import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { InfoCard } from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScenarioCard } from '../components/ScenarioCard';
import { Screen } from '../components/Screen';
import { getScenarios } from '../services/api';
import { useAppState } from '../state/AppStateContext';
import { colors } from '../theme/colors';
import type { ScenarioSummary } from '../types/api';
import type { MainTabParamList } from '../types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Scenarios'>;

export function ScenarioSelectorScreen({ navigation }: Props) {
  const { selectedScenario, setSelectedScenario } = useAppState();
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [customRisk, setCustomRisk] = useState('Urban crisis');
  const [customDescription, setCustomDescription] = useState('');

  useEffect(() => {
    getScenarios()
      .then(setScenarios)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen
      eyebrow="Scenarios"
      title="Scenario Planning"
      subtitle="Select a saved CIRO incident or write a custom field scenario for the same response loop."
    >
      <InfoCard accent="blue" title="Saved CIRO Scenarios" subtitle="Cards summarize location, risk type, and expected agent behavior." />
      {loading ? <ActivityIndicator color={colors.blue} /> : null}
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.scenario_id}
          scenario={scenario}
          selected={selectedScenario?.scenario_id === scenario.scenario_id}
          onPress={() => setSelectedScenario(scenario)}
        />
      ))}
      {!loading && scenarios.length === 0 ? <Text>No scenarios available.</Text> : null}
      <InfoCard accent="violet" title="Write Custom Scenario">
        <View style={styles.form}>
          <Input label="Scenario title" value={customTitle} onChangeText={setCustomTitle} placeholder="Ambulance blocked near flooded underpass" />
          <Input label="Location" value={customLocation} onChangeText={setCustomLocation} placeholder="G-10 Islamabad" />
          <Input label="Risk type" value={customRisk} onChangeText={setCustomRisk} placeholder="Flooding / traffic / public report" />
          <Input
            label="Situation details"
            multiline
            value={customDescription}
            onChangeText={setCustomDescription}
            placeholder="Describe what field officers know, which roads are affected, and any constraints."
          />
          <PrimaryButton
            icon="add-circle-outline"
            label="Use Custom Scenario"
            disabled={!customTitle.trim() || !customLocation.trim() || !customDescription.trim()}
            onPress={() => {
              const scenario: ScenarioSummary = {
                scenario_id: `custom-${Date.now()}`,
                title: customTitle.trim(),
                location: customLocation.trim(),
                riskType: customRisk.trim() || 'Custom crisis',
                description: customDescription.trim(),
                customText: `${customTitle.trim()} at ${customLocation.trim()}. ${customDescription.trim()}`,
                expectedAgentBehavior: 'Verify officer-provided details, reason over risk, plan simulated response, evaluate, and re-plan.',
                urgency: 'High',
              };
              setScenarios((current) => [scenario, ...current.filter((item) => !item.scenario_id.startsWith('custom-'))]);
              setSelectedScenario(scenario);
              navigation.navigate('Dashboard');
            }}
          />
        </View>
      </InfoCard>
      <PrimaryButton icon="speedometer-outline" label="Go To Dashboard" onPress={() => navigation.navigate('Dashboard')} />
    </Screen>
  );
}

function Input({
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        style={[styles.input, multiline && styles.textArea]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 118,
    textAlignVertical: 'top',
  },
});
