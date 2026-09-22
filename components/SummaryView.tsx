import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Meeting, MeetingSummary } from '../types/meeting';

export function summaryToSpeech(summary: MeetingSummary) {
  const list = (title: string, values: string[]) => `${title}. ${values.length ? values.join('. ') : 'Aucun élément.'}`;
  const actions = summary.actionsAVenir.length
    ? summary.actionsAVenir.map(({ action, responsable, delai }) => `${action}. Responsable : ${responsable}. Délai : ${delai}`).join('. ')
    : 'Aucune action identifiée.';
  return `Contexte. ${summary.contexte}. ${list('Points clés', summary.pointsCles)}. ${list('Décisions', summary.decisions)}. Récapitulatif des actions. ${actions}`;
}

export function SummaryView({ meeting }: { meeting: Meeting }) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => { void Speech.stop(); }, []);

  const toggleSpeech = async () => {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(summaryToSpeech(meeting.summary), {
      language: 'fr-FR',
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Résumé</Text>
        <Pressable accessibilityRole="button" onPress={toggleSpeech} style={styles.speechButton}>
          <Text style={styles.speechText}>{speaking ? '■ Arrêter' : '▶ Écouter'}</Text>
        </Pressable>
      </View>
      <Section title="Contexte" text={meeting.summary.contexte} />
      <ListSection title="Points clés" values={meeting.summary.pointsCles} />
      <ListSection title="Décisions" values={meeting.summary.decisions} />
      <ActionTable actions={meeting.summary.actionsAVenir} />
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Transcription</Text>
      <Text style={styles.body}>{meeting.transcription}</Text>
    </View>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{text}</Text></View>;
}

function ListSection({ title, values }: { title: string; values: string[] }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{values.length ? values.map((value, index) => <Text key={`${title}-${index}`} style={styles.body}>• {value}</Text>) : <Text style={styles.muted}>Aucun élément identifié.</Text>}</View>;
}

function ActionTable({ actions }: { actions: MeetingSummary['actionsAVenir'] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Récapitulatif des actions</Text>
      {actions.length ? (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableHeaderText, styles.actionCell]}>Action</Text>
            <Text style={[styles.tableHeaderText, styles.metaCell]}>Responsable</Text>
            <Text style={[styles.tableHeaderText, styles.metaCell]}>Délai</Text>
          </View>
          {actions.map((item, index) => (
            <View key={`${item.action}-${index}`} style={[styles.tableRow, index === actions.length - 1 && styles.lastTableRow]}>
              <Text style={[styles.tableText, styles.actionCell]}>{item.action}</Text>
              <Text style={[styles.tableText, styles.metaCell]}>{item.responsable}</Text>
              <Text style={[styles.tableText, styles.metaCell]}>{item.delai}</Text>
            </View>
          ))}
        </View>
      ) : <Text style={styles.muted}>Aucune action identifiée.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 22, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#17213A' },
  speechButton: { borderRadius: 12, backgroundColor: '#E8EEFF', paddingHorizontal: 14, paddingVertical: 10 },
  speechText: { color: '#2359D9', fontWeight: '700' },
  section: { gap: 7 },
  sectionTitle: { color: '#17213A', fontWeight: '800', fontSize: 16 },
  body: { color: '#475570', lineHeight: 22 },
  muted: { color: '#7C879B', fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#E5E9F0' },
  table: { borderWidth: 1, borderColor: '#DDE3EE', borderRadius: 12, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#DDE3EE' },
  lastTableRow: { borderBottomWidth: 0 },
  tableHeader: { backgroundColor: '#EEF3FF' },
  tableHeaderText: { color: '#243B70', fontSize: 12, fontWeight: '800', padding: 9 },
  tableText: { color: '#475570', fontSize: 12, lineHeight: 17, padding: 9 },
  actionCell: { flex: 2 },
  metaCell: { flex: 1, borderLeftWidth: 1, borderLeftColor: '#DDE3EE' },
});
