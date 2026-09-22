import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  state: 'idle' | 'recording' | 'paused' | 'stopped';
  durationMillis: number;
  isAnalyzing: boolean;
  analysisEnabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onAnalyze: () => void;
  onReset: () => void;
};

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function AudioRecorder(props: Props) {
  const { state, durationMillis, isAnalyzing, analysisEnabled } = props;
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>NOUVELLE RÉUNION</Text>
      <Text style={styles.timer}>{formatDuration(durationMillis)}</Text>
      <View style={styles.statusRow}>
        <View style={[styles.dot, state === 'recording' && styles.dotActive]} />
        <Text style={styles.status}>
          {state === 'recording' ? 'Enregistrement' : state === 'paused' ? 'En pause' : state === 'stopped' ? 'Prêt à analyser' : 'Prêt'}
        </Text>
      </View>

      {state === 'idle' && <Button label="Démarrer" onPress={props.onStart} primary />}
      {(state === 'recording' || state === 'paused') && (
        <View style={styles.actions}>
          <Button label={state === 'paused' ? 'Reprendre' : 'Pause'} onPress={state === 'paused' ? props.onResume : props.onPause} />
          <Button label="Arrêter" onPress={props.onStop} danger />
        </View>
      )}
      {state === 'stopped' && (
        <View style={styles.actions}>
          <Button label="Recommencer" onPress={props.onReset} disabled={isAnalyzing} />
          <Button
            label={isAnalyzing ? 'Analyse…' : analysisEnabled ? 'Transcrire et résumer' : 'Résumé non configuré'}
            onPress={props.onAnalyze}
            primary
            disabled={isAnalyzing || !analysisEnabled}
            loading={isAnalyzing}
          />
        </View>
      )}
    </View>
  );
}

function Button({ label, onPress, primary, danger, disabled, loading }: { label: string; onPress: () => void; primary?: boolean; danger?: boolean; disabled?: boolean; loading?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, primary && styles.primary, danger && styles.danger, (pressed || disabled) && styles.dimmed]}>
      {loading && <ActivityIndicator color="#fff" size="small" />}
      <Text style={[styles.buttonText, (primary || danger) && styles.lightText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 16, shadowColor: '#17213A', shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
  eyebrow: { color: '#596780', fontWeight: '700', fontSize: 12, letterSpacing: 1.2 },
  timer: { color: '#17213A', fontSize: 52, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#AAB3C2' },
  dotActive: { backgroundColor: '#F04444' },
  status: { color: '#596780' },
  actions: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: '#E9EDF4', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  primary: { backgroundColor: '#2359D9' },
  danger: { backgroundColor: '#D83A52' },
  buttonText: { color: '#26334D', fontWeight: '700', textAlign: 'center' },
  lightText: { color: '#fff' },
  dimmed: { opacity: 0.55 },
});
