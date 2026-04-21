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

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioURLRef = useRef("");
  const isRecordingRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

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
    } else {
      recorder.stream.getTracks().forEach((t) => t.stop());
      recorder.stop();
    }

    const handleData = (e: BlobEvent) => {
      if (audioURLRef.current) {
        URL.revokeObjectURL(audioURLRef.current);
      }
      const url = URL.createObjectURL(e.data);
      audioURLRef.current = url;
      setAudioURL(url);
    };

    recorder.addEventListener("dataavailable", handleData);
    return () => {
      recorder.removeEventListener("dataavailable", handleData);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [recorder, isRecording]);

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const resetRecording = () => {
    if (audioURLRef.current) {
      URL.revokeObjectURL(audioURLRef.current);
      audioURLRef.current = "";
    }
    setAudioURL("");
  };

  return {
    audioURL,
    isRecording,
    startRecording,
    stopRecording,
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
