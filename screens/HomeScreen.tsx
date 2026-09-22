import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AudioRecorder } from '../components/AudioRecorder';
import { SummaryView } from '../components/SummaryView';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { analyzeMeeting, getAnalysisServiceStatus } from '../services/aiService';
import type { Meeting } from '../types/meeting';

const LEGACY_HISTORY_KEY = '@reunion-ia/meetings/v1';

export function HomeScreen() {
  const recorder = useAudioRecorder();
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [serviceReachable, setServiceReachable] = useState<boolean | null>(null);

  useEffect(() => {
    // Efface définitivement l'ancien historique et ne sauvegarde plus les nouvelles réunions.
    void AsyncStorage.removeItem(LEGACY_HISTORY_KEY);
    getAnalysisServiceStatus().then((status) => {
      setServiceReachable(status.ok);
      setAnalysisEnabled(status.analysisEnabled);
    });
  }, []);

  useEffect(() => {
    if (recorder.error) Alert.alert('Enregistrement', recorder.error);
  }, [recorder.error]);

  const analyze = async () => {
    if (!recorder.audioUri) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeMeeting(recorder.audioUri);
      const meeting: Meeting = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        durationMillis: recorder.durationMillis,
        ...result,
      };
      setSelected(meeting);
      recorder.reset();
    } catch (cause) {
      Alert.alert('Analyse impossible', cause instanceof Error ? cause.message : 'Une erreur inattendue est survenue.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View><Text style={styles.title}>Réunion IA</Text><Text style={styles.subtitle}>Enregistrez. Comprenez. Agissez.</Text></View>
      {serviceReachable === false && (
        <View style={styles.warning}><Text style={styles.warningText}>Le serveur d’analyse est arrêté ou inaccessible.</Text></View>
      )}
      {serviceReachable === true && !analysisEnabled && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Résumé réel non activé : configurez OPENAI_API_KEY dans server/.env. Aucun faux résumé ne sera généré.</Text>
        </View>
      )}
      <AudioRecorder state={recorder.state} durationMillis={recorder.durationMillis} isAnalyzing={isAnalyzing} analysisEnabled={analysisEnabled} onStart={recorder.start} onPause={recorder.pause} onResume={recorder.resume} onStop={() => void recorder.stop()} onAnalyze={() => void analyze()} onReset={recorder.reset} />
      {selected && <SummaryView meeting={selected} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, gap: 22, paddingBottom: 48 },
  title: { color: '#17213A', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#657089', fontSize: 16, marginTop: 4 },
  warning: { backgroundColor: '#FFF3D6', borderColor: '#F1C75B', borderWidth: 1, borderRadius: 14, padding: 14 },
  warningText: { color: '#6E5012', fontWeight: '700', lineHeight: 20 },
});
