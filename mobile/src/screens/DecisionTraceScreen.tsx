import { DecisionTraceCard } from '../components/DecisionTraceCard';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { mockPipelineResult } from '../data/mockData';
import { useAppState } from '../state/AppStateContext';

export function DecisionTraceScreen() {
  const { pipelineResult } = useAppState();
  const result = pipelineResult || mockPipelineResult;

  return (
    <Screen
      eyebrow="Explainability"
      title="Decision Trace"
      subtitle="Inspect concise reasoning summaries, confidence, crisis level, and next step."
    >
      <InfoCard accent="violet" title="Decision Trace" subtitle="Shows data sources, confidence, crisis level, recommended action, approval status, and next step." />
      {result.iterations.map((trace) => (
        <DecisionTraceCard key={trace.iteration_number} trace={trace} />
      ))}
    </Screen>
  );
}
