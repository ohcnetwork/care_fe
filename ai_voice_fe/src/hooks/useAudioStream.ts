import { useCallback, useRef, useState } from "react";

interface UseAudioStreamOptions {
  onAudioData: (data: ArrayBuffer) => void;
  sampleRate?: number;
}

interface AudioStreamState {
  isRecording: boolean;
  audioLevel: number;
  error: string | null;
}

export function useAudioStream({
  onAudioData,
  sampleRate = 16000,
}: UseAudioStreamOptions) {
  const [state, setState] = useState<AudioStreamState>({
    isRecording: false,
    audioLevel: 0,
    error: null,
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate,
          channelCount: 1,
        },
      });

      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Analyser for visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      // ScriptProcessor to capture raw PCM and send to WebSocket
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        onAudioData(pcm16.buffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Audio level monitoring
      const updateLevel = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
        setState((prev) => ({ ...prev, audioLevel: Math.round(avg) }));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      setState({ isRecording: true, audioLevel: 0, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access microphone";
      setState({ isRecording: false, audioLevel: 0, error: message });
    }
  }, [onAudioData, sampleRate]);

  const stopRecording = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;

    setState({ isRecording: false, audioLevel: 0, error: null });
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
  };
}
