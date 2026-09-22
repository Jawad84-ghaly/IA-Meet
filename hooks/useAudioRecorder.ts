import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

type RecordingStatus = Awaited<ReturnType<Audio.Recording['getStatusAsync']>>;

type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped';

export function useAudioRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mountedRef = useRef(true);
  const [state, setState] = useState<RecorderState>('idle');
  const [durationMillis, setDurationMillis] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback((status: RecordingStatus) => {
    if (!mountedRef.current) return;
    setDurationMillis(status.durationMillis);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error("L’accès au microphone est nécessaire pour enregistrer une réunion.");
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const recording = new Audio.Recording();
      recording.setOnRecordingStatusUpdate(updateStatus);
      recording.setProgressUpdateInterval(250);
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setAudioUri(null);
      setDurationMillis(0);
      setState('recording');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Impossible de démarrer l’enregistrement.";
      setError(message);
      setState('idle');
    }
  }, [updateStatus]);

  const pause = useCallback(async () => {
    try {
      await recordingRef.current?.pauseAsync();
      setState('paused');
    } catch {
      setError("Impossible de mettre l’enregistrement en pause.");
    }
  }, []);

  const resume = useCallback(async () => {
    try {
      await recordingRef.current?.startAsync();
      setState('recording');
    } catch {
      setError("Impossible de reprendre l’enregistrement.");
    }
  }, []);

  const stop = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return null;
    try {
      const status = await recording.getStatusAsync();
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      setDurationMillis(status.durationMillis);
      setAudioUri(uri);
      setState('stopped');
      return uri;
    } catch {
      setError("Impossible de finaliser l’enregistrement.");
      return null;
    }
  }, [durationMillis]);

  const reset = useCallback(() => {
    setAudioUri(null);
    setDurationMillis(0);
    setError(null);
    setState('idle');
  }, []);

  useEffect(() => () => {
    mountedRef.current = false;
    const recording = recordingRef.current;
    recordingRef.current = null;
    if (recording) void recording.stopAndUnloadAsync().catch(() => undefined);
  }, []);

  return { state, durationMillis, audioUri, error, start, pause, resume, stop, reset };
}
