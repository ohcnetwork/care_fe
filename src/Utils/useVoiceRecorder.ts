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
  const cleanupPromiseRef = useRef<Promise<void> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Sync recorderRef with recorder state for unmount cleanup
  useEffect(() => {
    recorderRef.current = recorder;
  }, [recorder]);

  const revokeAudioURL = (): void => {
    if (audioURLRef.current) {
      URL.revokeObjectURL(audioURLRef.current);
      audioURLRef.current = "";
    }
  };

  const cleanupAudioResources = async (): Promise<void> => {
    // If cleanup is already in progress, wait for it to complete
    if (cleanupPromiseRef.current) {
      await cleanupPromiseRef.current;
      return;
    }

    // Create and store cleanup promise to prevent concurrent cleanups
    const cleanupPromise = (async (): Promise<void> => {
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
    })();

    cleanupPromiseRef.current = cleanupPromise;
    await cleanupPromise;
    cleanupPromiseRef.current = null;
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
      // Clear recorder after data is available and recording has stopped
      if (!isRecordingRef.current) {
        setRecorder(null);
      }
    };

    // Store reference for cleanup
    handleDataRef.current = handleData;

    // Attach listener before stopping to ensure we capture the data
    recorder.addEventListener("dataavailable", handleData);

    if (isRecording) {
      const initializeRecording = async () => {
        try {
          // Wait for any pending cleanup before starting
          await cleanupAudioResources();
          recorder.start();
          await setupAudioAnalyser();
        } catch (error) {
          // Handle start errors (e.g., already started, no stream)
          console.error("Failed to start recorder:", error);
          setIsRecording(false);
        }
      };
      void initializeRecording();
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

  const setupAudioAnalyser = async (): Promise<void> => {
    // Wait for cleanup to complete before creating new resources
    await cleanupAudioResources();

    // Use recorderRef to ensure we have the latest recorder instance
    const currentRecorder = recorderRef.current;
    if (!currentRecorder?.stream) {
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
      currentRecorder.stream,
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

  // Unmount-only effect: handles final cleanup when component unmounts
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;

      const cleanup = async () => {
        // Remove listener before stopping to prevent state updates
        // Use recorderRef to access the latest recorder instance
        if (recorderRef.current && handleDataRef.current) {
          try {
            recorderRef.current.removeEventListener(
              "dataavailable",
              handleDataRef.current,
            );

            if (recorderRef.current.state !== "inactive") {
              recorderRef.current.stop();
            }
            if (recorderRef.current.stream) {
              recorderRef.current.stream
                .getTracks()
                .forEach((track) => track.stop());
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
  }, []); // Empty dependency array for unmount-only cleanup

  // Recorder-change effect: handles cleanup when recorder changes (not on unmount)
  useEffect(() => {
    if (!recorder) {
      return;
    }

    return () => {
      // Only stop recorder and tracks, don't set isUnmountingRef
      // Listener removal is handled by the main recorder effect cleanup
      try {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
        if (recorder.stream) {
          recorder.stream.getTracks().forEach((track) => track.stop());
        }
      } catch {
        // Ignore errors during cleanup
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
