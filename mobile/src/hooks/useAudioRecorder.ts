import { useState, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { Recorder } from '@react-native-community/audio-toolkit';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingPath: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<Recorder | null>(null);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Reachr needs access to your microphone to record voice notes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS permissions handled via Info.plist
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setError('Microphone permission denied');
        return;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `recording_${timestamp}.m4a`;

      // Create recorder instance
      const recorder = new Recorder(filename, {
        bitrate: 128000,
        channels: 1,
        sampleRate: 44100,
        format: 'aac',
        encoder: 'aac',
        quality: 'high',
      });

      recorderRef.current = recorder;

      // Start recording
      recorder.prepare((err, fsPath) => {
        if (err) {
          console.error('Prepare error:', err);
          setError('Failed to prepare recording');
          return;
        }

        recorder.record((recordErr) => {
          if (recordErr) {
            console.error('Record error:', recordErr);
            setError('Failed to start recording');
            return;
          }
          setIsRecording(true);
          setRecordingPath(fsPath || null);
        });
      });
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      const recorder = recorderRef.current;
      if (!recorder) {
        return null;
      }

      return new Promise((resolve) => {
        recorder.stop((err) => {
          if (err) {
            console.error('Stop error:', err);
            setError('Failed to stop recording');
            resolve(null);
          } else {
            const path = recorder.fsPath;
            setRecordingPath(path || null);
            resolve(path || null);
          }
          setIsRecording(false);
          recorderRef.current = null;
        });
      });
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to stop recording');
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
  };
}
