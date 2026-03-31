import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVoiceInputOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export function useVoiceInput({ onResult, onError }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    const hasGetUserMedia = typeof navigator.mediaDevices?.getUserMedia !== 'undefined';
    setIsSupported(hasMediaRecorder && hasGetUserMedia);

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      console.log('[Voice Input] Recording stopped');
    }
  }, []);

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`;

      console.log('[Voice Input] Sending audio for transcription...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to transcribe audio');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || 'Transcription failed');
      }

      console.log('[Voice Input] Transcription successful:', data.transcript);
      onResult(data.transcript);
    } catch (err) {
      console.error('[Voice Input] Transcription error:', err);
      if (onError) {
        onError(err instanceof Error ? err.message : 'Failed to transcribe audio. Please try again.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const startListening = useCallback(async () => {
    if (!isSupported) {
      if (onError) {
        onError('Voice input is not supported on this device or browser.');
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size > 0) {
          await transcribeAudio(audioBlob);
        } else {
          if (onError) {
            onError('No audio recorded. Please try again.');
          }
        }

        audioChunksRef.current = [];
        setRecordingTime(0);
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error('[Voice Input] MediaRecorder error:', event);
        setIsListening(false);
        if (onError) {
          onError('Recording failed. Please try again.');
        }
      };

      mediaRecorder.start(1000);
      setIsListening(true);
      setRecordingTime(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 30) {
            stopListening();
          }
          return newTime;
        });
      }, 1000);

      console.log('[Voice Input] Recording started');
    } catch (err) {
      console.error('[Voice Input] Failed to start recording:', err);
      setIsListening(false);

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          if (onError) {
            onError('Microphone permission denied. Please enable it in your device settings.');
          }
        } else if (err.name === 'NotFoundError') {
          if (onError) {
            onError('No microphone found. Please check your device.');
          }
        } else {
          if (onError) {
            onError('Failed to access microphone. Please try again.');
          }
        }
      } else {
        if (onError) {
          onError('Failed to start recording. Please try again.');
        }
      }
    }
  }, [isSupported, onError, onResult, stopListening]);

  return {
    isListening,
    isTranscribing,
    isSupported,
    recordingTime,
    startListening,
    stopListening,
  };
}
