import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { ArtifactViewer } from '../components/ArtifactViewer';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { getArtifactContent, getArtifacts } from '../services/api';
import { colors } from '../theme/colors';
import type { ArtifactInfo } from '../types/api';

const preferredOrder = [
  'scenario_input.json',
  'iteration_1_decision_trace.json',
  'iteration_2_replan_trace.json',
  'iteration_3_final_trace.json',
  'risk_score.json',
  'rescue_action_plan.md',
  'final_crisis_report.md',
  'human_approval_record.json',
];

export function ArtifactsScreen() {
  const [artifacts, setArtifacts] = useState<ArtifactInfo[]>([]);
  const [selected, setSelected] = useState<string | undefined>();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArtifacts()
      .then((items) => {
        const filtered = preferredOrder
          .map((filename) => items.find((item) => item.filename === filename))
          .filter((item): item is ArtifactInfo => Boolean(item));
        setArtifacts(filtered.length ? filtered : items);
      })
      .finally(() => setLoading(false));
  }, []);

  const select = async (filename: string) => {
    setSelected(filename);
    setContent(await getArtifactContent(filename));
  };

  return (
    <Screen
      eyebrow="Evidence"
      title="Artifacts"
      subtitle="Review generated traces, plans, reports, and approval records."
    >
      <InfoCard accent="blue" title="Artifacts" subtitle="Judge-readable pipeline evidence from the CIRO backend." />
      {loading ? <ActivityIndicator color={colors.blue} /> : null}
      <ArtifactViewer artifacts={artifacts} selected={selected} content={content} onSelect={select} />
    </Screen>
  );
}
