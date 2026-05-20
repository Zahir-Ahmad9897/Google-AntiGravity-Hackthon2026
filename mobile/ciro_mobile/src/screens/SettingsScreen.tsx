import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../config/theme';
import { BASE_URLS } from '../config/appConfig';
import { apiService } from '../services/apiService';

export default function SettingsScreen() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadUrl = async () => {
      const saved = await apiService.getBaseUrl();
      setUrl(saved || BASE_URLS.default);
    };
    loadUrl();
  }, []);

  const saveUrl = async () => {
    await apiService.setBaseUrl(url);
    setStatus('idle');
  };

  const testConnection = async () => {
    setStatus('testing');
    await saveUrl();
    const isOk = await apiService.healthCheck();
    setStatus(isOk ? 'success' : 'error');
  };

  const resetUrl = async () => {
    setUrl(BASE_URLS.default);
    await apiService.clearBaseUrl();
    setStatus('idle');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>BACKEND CONNECTION</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={(val) => { setUrl(val); setStatus('idle'); }}
          placeholder="http://10.0.2.2:8000"
          placeholderTextColor={theme.colors.textMuted}
        />
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, {flex: 1, marginRight: 8}]} onPress={saveUrl}>
            <Text style={styles.btnText}>Save URL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnOutline, {flex: 1}]} onPress={testConnection}>
            <Text style={styles.btnOutlineText}>Test Connection</Text>
          </TouchableOpacity>
        </View>

        {status === 'testing' && <ActivityIndicator color={theme.colors.primary} style={{marginTop: 16}} />}
        {status === 'success' && <Text style={[styles.statusMsg, {color: theme.colors.success}]}>✓ Connected — backend is online</Text>}
        {status === 'error' && <Text style={[styles.statusMsg, {color: theme.colors.danger}]}>✗ Connection failed — check URL and ensure backend is running</Text>}
      </View>

      <Text style={styles.sectionTitle}>APP INFO</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>App version</Text><Text style={styles.infoVal}>CIRO v1.0.0</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Build</Text><Text style={styles.infoVal}>Hackathon 2026</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Framework</Text><Text style={styles.infoVal}>Expo + React Native</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Backend</Text><Text style={styles.infoVal}>FastAPI + Google ADK</Text></View>
      </View>

      <Text style={styles.sectionTitle}>DEVELOPER</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.devBtn} onPress={resetUrl}>
          <Text style={styles.devBtnText}>Reset to defaults</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.devBtn} onPress={resetUrl}>
          <Text style={styles.devBtnText}>Clear cached data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16 },
  sectionTitle: { color: theme.colors.textMuted, fontSize: 12, fontFamily: theme.typography.fontBold, marginTop: 24, marginBottom: 8 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, borderColor: theme.colors.border, borderWidth: 1 },
  input: { backgroundColor: theme.colors.background, color: theme.colors.textPrimary, padding: 12, borderRadius: 8, borderColor: theme.colors.border, borderWidth: 1, marginBottom: 16 },
  row: { flexDirection: 'row' },
  btn: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#000', fontFamily: theme.typography.fontBold },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary },
  btnOutlineText: { color: theme.colors.primary, fontFamily: theme.typography.fontBold },
  statusMsg: { marginTop: 16, fontSize: 12, fontFamily: theme.typography.fontBold, textAlign: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  infoLabel: { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily },
  infoVal: { color: theme.colors.textPrimary, fontFamily: theme.typography.fontBold },
  devBtn: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  devBtnText: { color: theme.colors.danger, fontFamily: theme.typography.fontBold },
});
