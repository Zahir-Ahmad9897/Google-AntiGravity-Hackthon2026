import React, { useState } from 'react';
import { Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../config/theme';
import { PipelineResult } from '../models/PipelineResult';

export default function ReportScreen({ route }: any) {
  const { result } = route.params as { result: PipelineResult };
  const [rawVisible, setRawVisible] = useState(false);
  const sections = parseMarkdown(result.final_crisis_report);

  const shareReport = () => {
    Share.share({
      title: 'CIRO Final Crisis Report',
      message: result.final_crisis_report,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section, index) => (
          <Text key={`${section.text}-${index}`} style={section.kind === 'heading' ? styles.heading : styles.body}>
            {section.text}
          </Text>
        ))}

        <TouchableOpacity style={styles.primaryButton} onPress={() => setRawVisible(true)}>
          <Text style={styles.primaryButtonText}>View Raw Artifact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={shareReport}>
          <Text style={styles.secondaryButtonText}>Share Report</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={rawVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.rawText}>{result.final_crisis_report}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setRawVisible(false)}>
              <Text style={styles.primaryButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function parseMarkdown(markdown: string) {
  return markdown.split('\n').filter(Boolean).map((line) => {
    const heading = line.startsWith('#');
    return {
      kind: heading ? 'heading' : 'body',
      text: line.replace(/^#+\s*/, ''),
    };
  });
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
  heading: {
    marginTop: theme.spacing.s16,
    marginBottom: theme.spacing.s8,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 18,
  },
  body: {
    marginBottom: theme.spacing.s8,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: 22,
  },
  primaryButton: {
    alignItems: 'center',
    marginTop: theme.spacing.s16,
    padding: theme.spacing.s12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: theme.spacing.s12,
    padding: theme.spacing.s12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.transparent,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontBold,
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
  rawText: {
    color: theme.colors.terminalText,
    fontFamily: theme.typography.fontMono,
    fontSize: 12,
    lineHeight: 18,
  },
});
