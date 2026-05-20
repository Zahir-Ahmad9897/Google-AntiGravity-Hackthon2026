import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AgentNodeWidget from '../components/AgentNodeWidget';
import IterationTracker from '../components/IterationTracker';
import TerminalLog from '../components/TerminalLog';
import { AGENTS, SCENARIO_METADATA } from '../config/appConfig';
import { theme } from '../config/theme';
import { usePipelineStore } from '../store/pipelineStore';

const PIPELINE_LOGS = [
  'Initializing CIRO Commander Agent...',
  'Weather Risk Agent: pulling simulated weather signals...',
  'Traffic Analysis Agent: analyzing road congestion data...',
  'Social Signal Agent: parsing public reports...',
  'Verification Agent: cross-checking signal sources...',
  'Crisis Reasoning Agent: inferring situation severity...',
  'Rescue Planning Agent: generating response plan...',
  'Action Execution Agent: simulating dispatch + rerouting...',
  'Evaluation Agent: assessing impact + replanning...',
];

const timestamp = () => new Date().toLocaleTimeString('en-US', { hour12: false });

export default function PipelineScreen({ route, navigation }: any) {
  const { scenarioId } = route.params;
  const {
    status,
    result,
    error,
    animationStep,
    addLogLine,
    reset,
    runPipeline,
    runCustomPipeline,
    setAnimationStep,
    updateIterationStatus,
  } = usePipelineStore();
  const [complete, setComplete] = useState(false);
  const animationStarted = useRef(false);
  const { customReport } = route.params;
  const meta = SCENARIO_METADATA[scenarioId];

  const finalIteration = useMemo(() => result?.iterations[result.iterations.length - 1], [result]);
  const outputs = finalIteration?.agent_outputs ?? [];

  useEffect(() => {
    reset();
    if (customReport) {
      runCustomPipeline(customReport);
    } else {
      runPipeline(scenarioId);
    }

    const logTimers = PIPELINE_LOGS.map((line, index) => setTimeout(() => {
      addLogLine(`[${timestamp()}] ${line}`);
    }, index * 300));

    const iterationTimers = [
      setTimeout(() => updateIterationStatus(0, 'running'), 0),
      setTimeout(() => {
        updateIterationStatus(0, 'done');
        updateIterationStatus(1, 'running');
      }, 8000),
      setTimeout(() => {
        updateIterationStatus(1, 'done');
        updateIterationStatus(2, 'running');
      }, 16000),
    ];

    return () => {
      [...logTimers, ...iterationTimers].forEach(clearTimeout);
    };
  }, [addLogLine, customReport, reset, runCustomPipeline, runPipeline, scenarioId, updateIterationStatus]);

  useEffect(() => {
    if (status !== 'success' || !result || animationStarted.current) {
      return;
    }

    animationStarted.current = true;

    const runAnimation = async () => {
      for (let index = 0; index < AGENTS.length; index += 1) {
        setAnimationStep(index);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      setAnimationStep(AGENTS.length);
      updateIterationStatus(0, 'done');
      updateIterationStatus(1, 'done');
      updateIterationStatus(2, 'done');
      addLogLine(`[${timestamp()}] Pipeline complete - crisis level: ${result.final_crisis_level}`);
      setComplete(true);

      setTimeout(() => {
        navigation.replace('Results', { result, scenarioId: result.scenario_id || scenarioId });
      }, 1200);
    };

    runAnimation();
  }, [addLogLine, navigation, result, scenarioId, setAnimationStep, status, updateIterationStatus]);

  useEffect(() => {
    if (status === 'error' && error) {
      addLogLine(`[${timestamp()}] Pipeline failed - ${error}`);
    }
  }, [addLogLine, error, status]);

  const renderAgent = ({ item, index }: any) => {
    const agentOutput = outputs[index];
    const nodeStatus = status === 'success'
      ? index < animationStep
        ? 'done'
        : index === animationStep
          ? 'running'
          : 'waiting'
      : 'waiting';

    return (
      <AgentNodeWidget
        agent={item}
        status={nodeStatus}
        summary={nodeStatus === 'done' ? agentOutput?.summary ?? '' : ''}
        timestamp={nodeStatus === 'done' ? timestamp() : ''}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity disabled style={styles.disabledBack} accessibilityLabel="Pipeline running">
          <Text style={styles.disabledBackText}>X</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{status === 'error' ? 'Pipeline Error' : 'Agent Pipeline Running...'}</Text>
          <Text style={styles.subtitle}>{meta?.displayName ?? scenarioId}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <IterationTracker />

      {status === 'error' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => runPipeline(scenarioId)}>
            <Text style={styles.retryText}>Retry Pipeline</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={AGENTS}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAgent}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <TerminalLog />

      {complete && (
        <Animated.View entering={FadeInUp.duration(350)} style={styles.banner}>
          <Text style={styles.bannerText}>Pipeline Complete</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s16,
    paddingVertical: theme.spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  disabledBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
  },
  disabledBackText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBold,
    fontSize: 14,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 17,
  },
  subtitle: {
    marginTop: theme.spacing.s4,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
  },
  list: {
    padding: theme.spacing.s16,
    paddingBottom: theme.spacing.s24,
  },
  errorCard: {
    margin: theme.spacing.s16,
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.opacity.dangerPill,
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
  banner: {
    position: 'absolute',
    right: theme.spacing.s16,
    bottom: 176,
    left: theme.spacing.s16,
    alignItems: 'center',
    padding: theme.spacing.s12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.success,
  },
  bannerText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
    fontSize: 16,
  },
});
