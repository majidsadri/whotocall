import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingPath: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  error: string | null;
  duration: string;
}

const audioRecorderPlayer = new AudioRecorderPlayer();

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      audioRecorderPlayer.stopRecorder().catch(() => {});
      audioRecorderPlayer.removeRecordBackListener();
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        }
        return false;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    // iOS permissions are handled automatically
    return true;
  };

  const startRecording = useCallback(async () => {
    console.log('[AudioRecorder] startRecording called');
    setError(null);
    setDuration('00:00');

    const hasPermission = await requestPermissions();
    console.log('[AudioRecorder] Permission result:', hasPermission);

    if (!hasPermission) {
      setError('Microphone permission denied');
      Alert.alert('Permission Required', 'Please enable microphone access in Settings.');
      return;
    }

    try {
      // Set recording state immediately
      setIsRecording(true);

      const path = Platform.select({
        ios: `recording_${Date.now()}.m4a`,
        android: `sdcard/recording_${Date.now()}.mp4`,
      });

      console.log('[AudioRecorder] Starting recording to:', path);

      const uri = await audioRecorderPlayer.startRecorder(path);
      console.log('[AudioRecorder] Recording started, uri:', uri);

      setRecordingPath(uri);

      audioRecorderPlayer.addRecordBackListener((e) => {
        const secs = Math.floor(e.currentPosition / 1000);
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        setDuration(`${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`);
      });
    } catch (err: any) {
      console.error('[AudioRecorder] Start error:', err);
      setError(`Failed to start recording: ${err.message || err}`);
      setIsRecording(false);
      Alert.alert('Recording Error', `Failed to start: ${err.message || err}`);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    console.log('[AudioRecorder] stopRecording called');

    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();

      console.log('[AudioRecorder] Recording stopped, path:', result);
      setRecordingPath(result);
      setIsRecording(false);

      return result;
    } catch (err: any) {
      console.error('[AudioRecorder] Stop error:', err);
      setError(`Failed to stop recording: ${err.message || err}`);
      setIsRecording(false);
      return null;
    }
  }, []);

  return {
    isRecording,
    recordingPath,
    startRecording,
    stopRecording,
    error,
    duration,
  };
}
