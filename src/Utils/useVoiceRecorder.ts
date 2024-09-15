import { useEffect, useState } from "react";
import { Error } from "./Notifications";

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
    // Lazily obtain recorder the first time we are recording.
    if (recorder === null) {
      if (isRecording) {
        requestRecorder().then(
          (fetchedRecorder) => {
            setRecorder(fetchedRecorder);
            handleMicPermission(true);
          },
          () => {
            Error({
              msg: "Please grant microphone permission to record audio.",
            });
            setIsRecording(false);
            handleMicPermission(false);
          },
        );
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
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source = audioContext.createMediaStreamSource(recorder?.stream as MediaStream);
    source.connect(analyser);

    const updateWaveform = () => {
      if (isRecording) {
        analyser?.getByteFrequencyData(dataArray);
        const normalizedWaveform = Array.from(dataArray).map(value =>
          Math.min(100, (value / 255) * 100),
        );
        setWaveform(normalizedWaveform);
        requestAnimationFrame(updateWaveform);
      }
    };

    updateWaveform();
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setWaveform([])
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
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return new MediaRecorder(stream);
}
export default useVoiceRecorder;