import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AudioRecorder } from '../components/AudioRecorder';
import { SummaryView } from '../components/SummaryView';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { analyzeMeeting, getAnalysisServiceStatus, getConfiguredApiBaseUrl, setApiBaseUrl } from '../services/aiService';
import type { Meeting } from '../types/meeting';

const LEGACY_HISTORY_KEY = '@reunion-ia/meetings/v1';
const SERVER_URL_KEY = '@reunion-ia/server-url/v1';

export function HomeScreen() {
  const recorder = useAudioRecorder();
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [serviceReachable, setServiceReachable] = useState<boolean | null>(null);
  const [serverUrl, setServerUrl] = useState(getConfiguredApiBaseUrl());
  const [checkingServer, setCheckingServer] = useState(false);

  useEffect(() => {
    // Efface définitivement l'ancien historique et ne sauvegarde plus les nouvelles réunions.
    void AsyncStorage.removeItem(LEGACY_HISTORY_KEY);
    void AsyncStorage.getItem(SERVER_URL_KEY).then((savedUrl) => {
      if (savedUrl) {
        setServerUrl(savedUrl);
        setApiBaseUrl(savedUrl);
      }
      return getAnalysisServiceStatus();
    }).then((status) => {
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

  const saveAndTestServer = async () => {
    const normalized = serverUrl.trim().replace(/\/$/, '');
    if (!/^https?:\/\//i.test(normalized)) {
      Alert.alert('Adresse invalide', 'Saisissez une adresse commençant par https:// ou http://.');
      return;
    }
    setCheckingServer(true);
    setApiBaseUrl(normalized);
    setServerUrl(normalized);
    await AsyncStorage.setItem(SERVER_URL_KEY, normalized);
    const status = await getAnalysisServiceStatus();
    setServiceReachable(status.ok);
    setAnalysisEnabled(status.analysisEnabled);
    setCheckingServer(false);
    Alert.alert(status.ok ? 'Serveur connecté' : 'Serveur inaccessible', status.ok
      ? 'L’adresse du serveur a été enregistrée.'
      : 'L’adresse est enregistrée, mais le serveur ne répond pas encore.');
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View><Text style={styles.title}>Réunion IA</Text><Text style={styles.subtitle}>Enregistrez. Comprenez. Agissez.</Text></View>
      <View style={styles.serverCard}>
        <Text style={styles.serverTitle}>Serveur sécurisé</Text>
        <Text style={styles.serverHelp}>Saisissez l’adresse HTTPS du proxy qui protège votre clé OpenAI.</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={setServerUrl}
          placeholder="https://mon-serveur.example.com"
          style={styles.serverInput}
          value={serverUrl}
        />
        <Pressable disabled={checkingServer} onPress={() => void saveAndTestServer()} style={({ pressed }) => [styles.serverButton, pressed && styles.pressed]}>
          <Text style={styles.serverButtonText}>{checkingServer ? 'Vérification…' : 'Tester et enregistrer'}</Text>
        </Pressable>
      </View>
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
  serverCard: { backgroundColor: '#fff', borderRadius: 18, gap: 10, padding: 16 },
  serverTitle: { color: '#17213A', fontSize: 17, fontWeight: '800' },
  serverHelp: { color: '#657089', lineHeight: 20 },
  serverInput: { borderColor: '#CBD3E1', borderRadius: 12, borderWidth: 1, color: '#17213A', paddingHorizontal: 12, paddingVertical: 11 },
  serverButton: { alignItems: 'center', backgroundColor: '#2359D9', borderRadius: 12, padding: 12 },
  serverButtonText: { color: '#fff', fontWeight: '800' },
  pressed: { opacity: 0.7 },
  warning: { backgroundColor: '#FFF3D6', borderColor: '#F1C75B', borderWidth: 1, borderRadius: 14, padding: 14 },
  warningText: { color: '#6E5012', fontWeight: '700', lineHeight: 20 },
});
