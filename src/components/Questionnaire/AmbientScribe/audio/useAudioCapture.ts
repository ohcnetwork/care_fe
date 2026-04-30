import { useCallback, useEffect, useRef, useState } from "react";

// Total bars must be even — we render a mirrored half so the meter is
// horizontally symmetric (center is the loudest, edges fade out).
const BAR_COUNT = 32;
const HALF_COUNT = BAR_COUNT / 2;

export interface AudioCaptureHandle {
  isActive: boolean;
  waveform: number[];
  errorMessage?: string;
  start: () => Promise<MediaStream>;
  stop: () => void;
  getStream: () => MediaStream | null;
}

/**
 * Captures the microphone and exposes:
 * - the raw MediaStream for downstream consumers (e.g. WebRTC addTrack).
 * - a continuously-updated `waveform` array (length = BAR_COUNT, values 0..1)
 *   derived from an AnalyserNode. This is what the UI meter binds to.
 *
 * The pattern (AnalyserNode + requestAnimationFrame + getByteFrequencyData)
 * mirrors the existing `useVoiceRecorder` hook at src/Utils/useVoiceRecorder.ts.
 */
export function useAudioCapture(): AudioCaptureHandle {
  const [isActive, setIsActive] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(() =>
    new Array(BAR_COUNT).fill(0),
  );
  const [errorMessage, setErrorMessage] = useState<string>();

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) {
      return streamRef.current;
    }
    setErrorMessage(undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtor();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      // Higher resolution + heavier smoothing → calmer, more cinematic
      // animation. The browser's smoothingTimeConstant is an exponential
      // moving average applied to the magnitude bins.
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.86;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bins = new Uint8Array(analyser.frequencyBinCount);
      // We focus on the lower ~half of the spectrum where speech energy
      // sits; that gives more visible motion than spreading across the
      // whole 0–24 kHz range.
      const SPEECH_BINS = Math.min(bins.length, 64);
      let prev = new Array<number>(HALF_COUNT).fill(0);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(bins);
        const step = Math.max(1, Math.floor(SPEECH_BINS / HALF_COUNT));
        const half = new Array<number>(HALF_COUNT).fill(0);
        for (let i = 0; i < HALF_COUNT; i++) {
          const start = i * step;
          let sum = 0;
          let count = 0;
          for (let j = start; j < start + step && j < SPEECH_BINS; j++) {
            sum += bins[j];
            count++;
          }
          const avg = count === 0 ? 0 : sum / count;
          // Light gamma curve so quiet speech is visible without making
          // loud audio clip the meter.
          const norm = Math.pow(Math.min(1, avg / 255), 0.7);
          // Extra exponential smoothing on top of the analyser's own
          // smoothing — the analyser smooths *between* frames, this
          // smooths *between bars* over time so motion feels less jittery.
          half[i] = prev[i] * 0.55 + norm * 0.45;
        }
        prev = half;
        // Mirror around the center: bars closest to the midline carry the
        // lowest-frequency (loudest, slowest) energy, edges carry highs.
        const mirrored = new Array<number>(BAR_COUNT);
        for (let i = 0; i < HALF_COUNT; i++) {
          mirrored[HALF_COUNT - 1 - i] = half[i];
          mirrored[HALF_COUNT + i] = half[i];
        }
        setWaveform(mirrored);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      setIsActive(true);
      return stream;
    } catch (error) {
      cleanup();
      const message =
        error instanceof Error ? error.message : "microphone_permission_denied";
      setErrorMessage(message);
      throw error;
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setIsActive(false);
    setWaveform(new Array(BAR_COUNT).fill(0));
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const getStream = useCallback(() => streamRef.current, []);

  return { isActive, waveform, errorMessage, start, stop, getStream };
}
