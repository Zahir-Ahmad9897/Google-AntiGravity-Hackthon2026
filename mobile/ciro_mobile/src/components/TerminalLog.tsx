import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../config/theme';
import { usePipelineStore } from '../store/pipelineStore';

export default function TerminalLog() {
  const { logLines } = usePipelineStore();
  const ref = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => ref.current?.scrollToEnd({ animated: true })}
      >
        {logLines.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.line}>{line}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    padding: theme.spacing.s12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.terminalBg,
  },
  line: {
    marginBottom: theme.spacing.s4,
    color: theme.colors.terminalText,
    fontFamily: theme.typography.fontMono,
    fontSize: 11,
    lineHeight: 17,
  },
});
