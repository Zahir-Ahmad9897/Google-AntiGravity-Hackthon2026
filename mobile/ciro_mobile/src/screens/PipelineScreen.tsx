import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import IterationTracker from '../components/IterationTracker';
import LiveIncidentTimeline from '../components/LiveIncidentTimeline';
import TacticalBackground from '../components/TacticalBackground';
import TerminalLog from '../components/TerminalLog';
import { SCENARIO_METADATA } from '../config/appConfig';
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

const PROCESSING_STAGES = [
  'Parsing report',
  'Extracting entities',
  'Resolving location',
  'Analyzing severity',
  'Checking weather',
  'Generating reroute',
  'Preparing emergency response',
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
      for (let index = 0; index < PROCESSING_STAGES.length; index += 1) {
        setAnimationStep(index);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      setAnimationStep(PROCESSING_STAGES.length);
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

  return (
    <SafeAreaView style={styles.container}>
      <TacticalBackground>
      <View style={styles.header}>
        <TouchableOpacity disabled style={styles.disabledBack} accessibilityLabel="Pipeline running">
          <Ionicons name="lock-closed" size={14} color={theme.colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{status === 'error' ? 'Pipeline Error' : 'AI Pipeline Running'}</Text>
          <Text style={styles.subtitle}>{meta?.displayName ?? scenarioId}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <IterationTracker />
        <View style={styles.stagePanel}>
          <View style={styles.stageHeader}>
            <Text style={styles.sectionTitle}>Sequential Agent Processing</Text>
            <Text style={styles.stageCount}>{Math.min(animationStep + 1, PROCESSING_STAGES.length)}/{PROCESSING_STAGES.length}</Text>
          </View>
          {PROCESSING_STAGES.map((stage, index) => {
            const current = index === animationStep && status !== 'error';
            const done = index < animationStep || status === 'success';
            return (
              <Animated.View entering={FadeInDown.delay(index * 60).duration(240)} key={stage} style={styles.stageRow}>
                <View style={[styles.stageIcon, done && styles.stageIconDone, current && styles.stageIconCurrent]}>
                  <Ionicons
                    name={done ? 'checkmark' : current ? 'pulse' : 'ellipse-outline'}
                    size={14}
                    color={done ? theme.colors.background : current ? theme.colors.primary : theme.colors.textMuted}
                  />
                </View>
                <View style={styles.stageBody}>
                  <Text style={[styles.stageText, current && styles.stageTextCurrent]}>{stage}</Text>
                  <Text style={styles.stageMeta}>{done ? 'Completed' : current ? 'Processing signal...' : 'Queued'}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
        <LiveIncidentTimeline trace={finalIteration} />

      {status === 'error' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => runPipeline(scenarioId)}>
            <Text style={styles.retryText}>Retry Pipeline</Text>
          </TouchableOpacity>
        </View>
      )}
        <View style={styles.terminalWrap}>
          <TerminalLog />
        </View>
      </ScrollView>

      {complete && (
        <Animated.View entering={FadeInUp.duration(350)} style={styles.banner}>
          <Text style={styles.bannerText}>Pipeline Complete</Text>
        </Animated.View>
      )}
      </TacticalBackground>
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
  scroll: {
    padding: theme.spacing.s16,
    paddingBottom: 220,
  },
  stagePanel: {
    gap: theme.spacing.s12,
    marginBottom: theme.spacing.s16,
    padding: theme.spacing.s16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.opacity.glass,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.s4,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 15,
  },
  stageCount: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s12,
  },
  stageIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
  },
  stageIconCurrent: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.opacity.primaryPill,
  },
  stageIconDone: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.success,
  },
  stageBody: {
    flex: 1,
  },
  stageText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBold,
    fontSize: 13,
  },
  stageTextCurrent: {
    color: theme.colors.textPrimary,
  },
  stageMeta: {
    marginTop: 2,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
  },
  terminalWrap: {
    minHeight: 220,
    overflow: 'hidden',
    borderRadius: theme.borderRadius.lg,
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
