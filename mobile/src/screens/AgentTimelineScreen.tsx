import { Text } from 'react-native';

import { AgentStatusCard } from '../components/AgentStatusCard';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { mockPipelineResult } from '../data/mockData';
import { useAppState } from '../state/AppStateContext';

export function AgentTimelineScreen() {
  const { pipelineResult } = useAppState();
  const result = pipelineResult || mockPipelineResult;

  return (
    <Screen
      eyebrow="Agents"
      title="Agent Timeline"
      subtitle="Follow each CIRO agent across the current iterative run."
    >
      <InfoCard accent="blue" title="Agent Timeline" subtitle="Every agent card shows concise summaries only. Hidden chain-of-thought is never displayed." />
      {result.iterations.map((trace) => (
        <InfoCard key={trace.iteration_number} title={`Iteration ${trace.iteration_number}`}>
          <Text>{trace.concise_reasoning_summary}</Text>
          {trace.agent_outputs.map((agent, index) => (
            <AgentStatusCard
              key={`${trace.iteration_number}-${agent.agent_name}`}
              agent={agent}
              status={index === trace.agent_outputs.length - 1 ? 'active' : 'completed'}
            />
          ))}
        </InfoCard>
      ))}
    </Screen>
  );
}
