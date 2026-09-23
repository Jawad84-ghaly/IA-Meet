import type { AnalysisResult } from '../types/meeting';
import { Platform } from 'react-native';

let apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

export type AnalysisServiceStatus = {
  ok: boolean;
  analysisEnabled: boolean;
  mode: 'openai' | 'configuration';
};

function getApiUrl(path: string) {
  if (!apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL manque. Consultez le README pour configurer le proxy.');
  }
  return `${apiBaseUrl}${path}`;
}

export function getConfiguredApiBaseUrl() {
  return apiBaseUrl ?? '';
}

export function setApiBaseUrl(value: string) {
  apiBaseUrl = value.trim().replace(/\/$/, '');
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Erreur du serveur (${response.status}).`;
  } catch {
    return `Erreur du serveur (${response.status}).`;
  }
}

export async function getAnalysisServiceStatus(): Promise<AnalysisServiceStatus> {
  try {
    const response = await fetch(getApiUrl('/health'));
    if (!response.ok) throw new Error();
    return (await response.json()) as AnalysisServiceStatus;
  } catch {
    return { ok: false, analysisEnabled: false, mode: 'configuration' };
  }
}

export async function analyzeMeeting(audioUri: string): Promise<AnalysisResult> {
  const form = new FormData();

  if (Platform.OS === 'web') {
    // Une URI issue de MediaRecorder est une URL blob: sur le Web. FormData doit
    // recevoir le vrai Blob, contrairement à React Native qui attend { uri, ... }.
    const audioResponse = await fetch(audioUri);
    if (!audioResponse.ok) throw new Error("Le fichier audio enregistré n’est plus accessible.");
    const blob = await audioResponse.blob();
    const mimeType = blob.type || 'audio/webm';
    const extension = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
    form.append('audio', blob, `reunion-${Date.now()}.${extension}`);
  } else {
    const cleanUri = audioUri.split('?')[0] ?? audioUri;
    const extension = cleanUri.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'm4a';
    const mimeType = extension === 'wav'
      ? 'audio/wav'
      : extension === 'webm'
        ? 'audio/webm'
        : 'audio/mp4';
    form.append('audio', {
      uri: audioUri,
      name: `reunion-${Date.now()}.${extension}`,
      type: mimeType,
    } as unknown as Blob);
  }

  let response: Response;
  try {
    response = await fetch(getApiUrl('/api/meetings/analyze'), {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new Error("Le serveur d’analyse est inaccessible. Vérifiez qu’il est démarré et que son URL est correcte.");
  }

  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as AnalysisResult;
}
