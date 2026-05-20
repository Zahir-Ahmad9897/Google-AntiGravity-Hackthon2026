import React from 'react';
import ResultsTabs from '../navigation/ResultsTabs';

export default function ResultsScreen({ route }: any) {
  const { result, scenarioId } = route.params;
  return <ResultsTabs result={result} scenarioId={scenarioId} />;
}
