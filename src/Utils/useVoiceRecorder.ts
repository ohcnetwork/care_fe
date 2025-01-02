import { useEffect, useState } from "react";

import * as Notify from "./Notifications";

const useVoiceRecorder = (handleMicPermission: (allowed: boolean) => void) => {
  const [audioURL, setAudioURL] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]); // Decibel waveform

  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;

  useEffect(() => {
    if (!isRecording && recorder && audioURL) {
      setRecorder(null);
    }
  }, [isRecording, recorder, audioURL]);

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
        Notify.Error({
          msg: errorMessage,
        });
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
      if (audioContext) {
        audioContext.close();
      }
    }

    const handleData = (e: BlobEvent) => {
      const url = URL.createObjectURL(e.data);
      setAudioURL(url);
      const blob = new Blob([e.data], { type: "audio/mpeg" });
      setBlob(blob);
    };

    recorder.addEventListener("dataavailable", handleData);
    return () => {
      recorder.removeEventListener("dataavailable", handleData);
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [recorder, isRecording]);

  const setupAudioAnalyser = () => {
    let animationFrameId: number;
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source = audioContext.createMediaStreamSource(
      recorder?.stream as MediaStream,
    );
    source.connect(analyser);

    const updateWaveform = () => {
      if (isRecording) {
        analyser?.getByteFrequencyData(dataArray);
        const normalizedWaveform = Array.from(dataArray).map((value) =>
          Math.min(100, (value / 255) * 100),
        );
        setWaveform(normalizedWaveform);
        animationFrameId = requestAnimationFrame(updateWaveform);
      } else {
        cancelAnimationFrame(animationFrameId);
        source?.disconnect();
        analyser?.disconnect();
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
    setAudioURL("");
    setBlob(null);
    setWaveform([]);
  };

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
