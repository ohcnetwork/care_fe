import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Extend Window interface for Safari webkitAudioContext support
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const useVoiceRecorder = (handleMicPermission: (allowed: boolean) => void) => {
  const [audioURL, setAudioURL] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]); // Decibel waveform

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const audioURLRef = useRef<string>("");
  const isRecordingRef = useRef<boolean>(false);
  const isUnmountingRef = useRef<boolean>(false);
  const handleDataRef = useRef<((e: BlobEvent) => void) | null>(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording && recorder && audioURL) {
      setRecorder(null);
    }
  }, [isRecording, recorder, audioURL]);

  const revokeAudioURL = (): void => {
    if (audioURLRef.current) {
      URL.revokeObjectURL(audioURLRef.current);
      audioURLRef.current = "";
    }
  };

  const cleanupAudioResources = async (): Promise<void> => {
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // Ignore if already disconnected
      }
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Ignore if already disconnected
      }
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        // Ignore if already closed
      }
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    const initializeRecorder = async () => {
      try {
        const fetchedRecorder = await requestRecorder();
        setRecorder(fetchedRecorder);
        handleMicPermission(true);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Please grant microphone permission to record audio.";
        toast.error(errorMessage);
        setIsRecording(false);
        handleMicPermission(false);
      }
    };
    // Lazily obtain recorder the first time we are recording.
    if (recorder === null) {
      if (isRecording) {
        initializeRecorder();
      }
      return;
    }

    const handleData = (e: BlobEvent) => {
      // Prevent state updates after unmount
      if (isUnmountingRef.current) {
        return;
      }
      revokeAudioURL();
      const url = URL.createObjectURL(e.data);
      audioURLRef.current = url;
      setAudioURL(url);
      const blob = new Blob([e.data], { type: "audio/mpeg" });
      setBlob(blob);
    };

    // Store reference for cleanup
    handleDataRef.current = handleData;

    // Attach listener before stopping to ensure we capture the data
    recorder.addEventListener("dataavailable", handleData);

    if (isRecording) {
      try {
        recorder.start();
        setupAudioAnalyser();
      } catch (error) {
        // Handle start errors (e.g., already started, no stream)
        console.error("Failed to start recorder:", error);
        setIsRecording(false);
      }
    } else {
      // Correct order: stop recorder first, then stop tracks
      recorder.stop();
      if (recorder.stream) {
        recorder.stream.getTracks().forEach((track) => track.stop());
      }
      void cleanupAudioResources();
    }
    return () => {
      recorder.removeEventListener("dataavailable", handleData);
      void cleanupAudioResources();
      revokeAudioURL();
    };
  }, [recorder, isRecording]);

  const setupAudioAnalyser = () => {
    void cleanupAudioResources();

    if (!recorder?.stream) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    audioContextRef.current = new AudioContextClass();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 32;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    sourceRef.current = audioContextRef.current.createMediaStreamSource(
      recorder.stream,
    );
    sourceRef.current.connect(analyserRef.current);

    const updateWaveform = (): void => {
      if (isRecordingRef.current && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const normalizedWaveform = Array.from(dataArray).map((value) =>
          Math.min(100, (value / 255) * 100),
        );
        setWaveform(normalizedWaveform);
        animationFrameIdRef.current = requestAnimationFrame(updateWaveform);
      } else {
        if (animationFrameIdRef.current !== null) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      }
    };

    updateWaveform();
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setWaveform([]);
  };

  const resetRecording = () => {
    revokeAudioURL();
    setAudioURL("");
    setBlob(null);
    setWaveform([]);
  };

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;

      const cleanup = async () => {
        // Remove listener before stopping to prevent state updates
        if (recorder && handleDataRef.current) {
          try {
            recorder.removeEventListener(
              "dataavailable",
              handleDataRef.current,
            );

            if (recorder.state !== "inactive") {
              recorder.stop();
            }
            if (recorder.stream) {
              recorder.stream.getTracks().forEach((track) => track.stop());
            }
          } catch {
            // Ignore errors during cleanup
          }
        }

        // Await cleanup to handle async AudioContext.close()
        await cleanupAudioResources();
        revokeAudioURL();
      };

      void cleanup();
    };
  }, [recorder]);

  return {
    audioURL,
    isRecording,
    startRecording,
    stopRecording,
    blob,
    waveform,
    resetRecording,
  };
};

async function requestRecorder() {
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      // iOS Safari requires these constraints
      sampleRate: 44100,
      channelCount: 1,
    },
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // iOS Safari requires a different mime type
    const options = {
      mimeType: MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4",
    };
    return new MediaRecorder(stream, options);
  } catch (error) {
    throw new Error(
      `Failed to initialize recorder: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
export default useVoiceRecorder;
