import { useState, useEffect } from "react";
import * as Notify from "./Notifications";

const useSegmentedRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  const [restart, setRestart] = useState(false);

  const bufferInterval = 1 * 1000;
  const splitSizeLimit = 20 * 1000000; // 20MB

  useEffect(() => {
    if (!isRecording && recorder && audioBlobs.length > 0) {
      setRecorder(null);
    }
  }, [isRecording, recorder, audioBlobs]);

  useEffect(() => {
    if (recorder === null) {
      if (isRecording || restart) {
        requestRecorder().then(
          (newRecorder) => {
            setRecorder(newRecorder);
            if (restart) {
              setIsRecording(true);
            }
          },
          () => {
            Notify.Error({
              msg: "Please grant microphone permission to record audio.",
            });
            setIsRecording(false);
          },
        );
      }
      return;
    }

    if (isRecording) {
      recorder.state === "inactive" && recorder.start(bufferInterval);
    } else {
      if (restart) {
        setIsRecording(true);
      } else {
        recorder?.stream?.getTracks()?.forEach((i) => i?.stop());
        recorder.stop();
      }
      recorder.state === "recording" && recorder.stop();
    }

    // Obtain the audio when ready.
    const handleData = (e: { data: Blob }) => {
      const newChunk = e.data;
      let currentBlob: Blob | undefined = audioBlobs[audioBlobs.length - 1];
      if (restart) {
        currentBlob = undefined;
      }
      if ((currentBlob?.size || 0) + newChunk.size < splitSizeLimit) {
        // Audio size is less than 20MB, appending to current blob
        if (!currentBlob) {
          // Current blob is null, setting new blob
          if (restart) {
            setAudioBlobs((prev) => [
              ...prev,
              new Blob([newChunk], { type: recorder.mimeType }),
            ]);
            setRestart(false);
            return;
          }
          setAudioBlobs([new Blob([newChunk], { type: recorder.mimeType })]);
          return;
        }
        // Appending new chunk to current blob
        const newBlob = new Blob([currentBlob, newChunk], {
          type: recorder.mimeType,
        });
        setAudioBlobs((prev) => [...prev.slice(0, prev.length - 1), newBlob]);
      } else {
        // Audio size exceeded 20MB, starting new recording
        if (currentBlob)
          setAudioBlobs((prev) => [
            ...prev.slice(0, prev.length - 1),
            new Blob([currentBlob ?? new Blob([]), newChunk], {
              type: recorder.mimeType,
            }),
          ]);
        recorder.stop();
        setRecorder(null);
        setRestart(true);
        setIsRecording(false);
      }
    };
    recorder.addEventListener("dataavailable", handleData);
    return () => recorder.removeEventListener("dataavailable", handleData);
  }, [recorder, isRecording, bufferInterval, audioBlobs, restart]);

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const resetRecording = () => {
    setAudioBlobs([]);
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    resetRecording,
    audioBlobs,
  };
};

async function requestRecorder() {
  return new Promise<MediaRecorder>((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream, {
          audioBitsPerSecond: 128000,
        });
        resolve(recorder);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export default useSegmentedRecording;
