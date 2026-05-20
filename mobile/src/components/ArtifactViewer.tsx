import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { ArtifactInfo } from '../types/api';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  artifacts: ArtifactInfo[];
  selected?: string;
  content?: string;
  onSelect: (filename: string) => void;
};

export function ArtifactViewer({ artifacts, selected, content, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {artifacts.map((artifact) => (
          <PrimaryButton
            key={artifact.filename}
            label={artifact.filename}
            onPress={() => onSelect(artifact.filename)}
            variant={selected === artifact.filename ? 'primary' : 'secondary'}
          />
        ))}
      </View>
      <View style={styles.contentBox}>
        <Text style={styles.content}>{content || 'Select an artifact to view.'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  list: {
    gap: 8,
  },
  contentBox: {
    backgroundColor: colors.navy2,
    borderRadius: 8,
    minHeight: 260,
    padding: 12,
  },
  content: {
    color: '#e5e7eb',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
