import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AgentNodeWidget from '../components/AgentNodeWidget';
import BeforeAfterPanel from '../components/BeforeAfterPanel';
import CrisisSummaryCard from '../components/CrisisSummaryCard';
import WeatherWidget from '../components/WeatherWidget';
import { AGENTS } from '../config/appConfig';
import { theme } from '../config/theme';
import { AgentStepOutput } from '../models/AgentStep';
import { PipelineResult } from '../models/PipelineResult';

export default function ResultsSummaryScreen({ route }: any) {
  const { result, scenarioId } = route.params as { result: PipelineResult; scenarioId: string };
  const [selectedTrace, setSelectedTrace] = useState<AgentStepOutput | null>(null);
  const finalIteration = result.iterations[result.iterations.length - 1];

  const agentRows = useMemo(() => finalIteration.agent_outputs.map((output, index) => ({
    output,
    agent: AGENTS[index] ?? { id: index + 1, name: output.agent_name, icon: '•' },
  })), [finalIteration.agent_outputs]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CrisisSummaryCard trace={finalIteration} scenarioId={scenarioId} />
      <WeatherWidget scenarioId={scenarioId} />
      <BeforeAfterPanel scenarioId={scenarioId} />

      <Text style={styles.sectionTitle}>Agent Pipeline Replay</Text>
      {agentRows.map(({ agent, output }) => (
        <TouchableOpacity key={output.agent_name} activeOpacity={0.88} onPress={() => setSelectedTrace(output)}>
          <AgentNodeWidget agent={agent} status="done" summary={output.summary} />
        </TouchableOpacity>
      ))}

      <Modal visible={Boolean(selectedTrace)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedTrace?.agent_name}</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>{selectedTrace ? JSON.stringify(selectedTrace, null, 2) : ''}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedTrace(null)}>
              <Text style={styles.closeText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.s16,
    paddingBottom: theme.spacing.s48,
  },
  sectionTitle: {
    marginTop: theme.spacing.s8,
    marginBottom: theme.spacing.s12,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.s20,
    backgroundColor: theme.opacity.modalBackdrop,
  },
  modalContent: {
    maxHeight: '82%',
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    marginBottom: theme.spacing.s12,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 16,
  },
  modalScroll: {
    maxHeight: 440,
  },
  modalText: {
    color: theme.colors.terminalText,
    fontFamily: theme.typography.fontMono,
    fontSize: 11,
    lineHeight: 17,
  },
  closeButton: {
    alignItems: 'center',
    marginTop: theme.spacing.s16,
    padding: theme.spacing.s12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  closeText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
  },
});
