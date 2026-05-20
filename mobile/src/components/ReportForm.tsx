import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme/colors';
import type { ManualReport } from '../types/api';
import { PermissionToggle } from './PermissionToggle';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  onSubmit: (report: ManualReport) => void;
  loading?: boolean;
};

export function ReportForm({ onSubmit, loading = false }: Props) {
  const [eventType, setEventType] = useState('Flooding / road blockage');
  const [location, setLocation] = useState('G-10 Islamabad');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<ManualReport['urgency']>('High');
  const [permissionGranted, setPermissionGranted] = useState(true);

  return (
    <View style={styles.form}>
      <Input label="Event type" value={eventType} onChangeText={setEventType} />
      <Input label="Location" value={location} onChangeText={setLocation} />
      <Input label="Description" value={description} onChangeText={setDescription} multiline />
      <Text style={styles.label}>Urgency</Text>
      <View style={styles.urgencyRow}>
        {(['Low', 'Medium', 'High', 'Critical'] as const).map((item) => (
          <View key={item} style={styles.urgencyItem}>
            <PrimaryButton label={item} variant={urgency === item ? 'primary' : 'secondary'} onPress={() => setUrgency(item)} />
          </View>
        ))}
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Optional image/audio attachment placeholder only. No media is uploaded in this MVP.</Text>
      </View>
      <PermissionToggle
        label="Submit as authorized emergency signal"
        description="The report is intentionally provided by the officer for CIRO analysis."
        value={permissionGranted}
        onChange={setPermissionGranted}
      />
      <PrimaryButton
        label={loading ? 'Submitting...' : 'Submit Manual Report'}
        icon="send-outline"
        disabled={loading || !description.trim()}
        onPress={() =>
          onSubmit({
            eventType,
            location,
            description,
            urgency,
            source: 'Field officer manual report',
            permissionGranted,
          })
        }
      />
    </View>
  );
}

function Input({
  label,
  value,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={colors.subtle}
        style={[styles.input, multiline && styles.textArea]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  urgencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  urgencyItem: {
    minWidth: 112,
  },
  placeholder: {
    backgroundColor: colors.blueSoft,
    borderColor: '#b2ddff',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  placeholderText: {
    color: colors.blue,
    fontSize: 12,
    lineHeight: 18,
  },
});
