import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording && recorder && audioURL) {
      setRecorder(null);
    }
  }, [isRecording, recorder, audioURL]);

  const cleanupAudioResources = (): void => {
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
        audioContextRef.current.close();
      } catch {
        // Ignore if already closed
      }
      audioContextRef.current = null;
    }
    if (audioURLRef.current) {
      URL.revokeObjectURL(audioURLRef.current);
      audioURLRef.current = "";
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

    if (isRecording) {
      recorder.start();
      setupAudioAnalyser();
    } else {
      recorder.stream.getTracks().forEach((i) => i.stop());
      recorder.stop();
      cleanupAudioResources();
    }

    const handleData = (e: BlobEvent) => {
      if (audioURLRef.current) {
        URL.revokeObjectURL(audioURLRef.current);
      }
      const url = URL.createObjectURL(e.data);
      audioURLRef.current = url;
      setAudioURL(url);
      const blob = new Blob([e.data], { type: "audio/mpeg" });
      setBlob(blob);
    };

    recorder.addEventListener("dataavailable", handleData);
    return () => {
      recorder.removeEventListener("dataavailable", handleData);
      cleanupAudioResources();
    };
  }, [recorder, isRecording]);

  const setupAudioAnalyser = () => {
    cleanupAudioResources();

    if (!recorder?.stream) {
      return;
    }

    audioContextRef.current = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
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
    if (audioURLRef.current) {
      URL.revokeObjectURL(audioURLRef.current);
      audioURLRef.current = "";
    }
    setAudioURL("");
    setBlob(null);
    setWaveform([]);
  };

  useEffect(() => {
    return () => {
      cleanupAudioResources();
      if (recorder) {
        try {
          recorder.stream.getTracks().forEach((track) => track.stop());
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
        } catch {
          // Ignore errors during cleanup
        }
      }
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
