import { useEffect, useState } from "react";
import { Error } from "./Notifications";

const useRecorder = (handleMicPermission) => {
  const [audioURL, setAudioURL] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [newBlob, setNewBlob] = useState(null);

  useEffect(() => {
    // Lazily obtain recorder first time we're recording.
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
          }
        );
      }
      return;
    }

    // Manage recorder state.
    if (isRecording) {
      recorder.start();
    } else {
      recorder.stop();
    }

    // Obtain the audio when ready.
    const handleData = (e) => {
      const url = URL.createObjectURL(e.data);
      setAudioURL(url);
      let blob = new Blob([e.data], { type: "audio/mpeg" });
      setNewBlob(blob);
    };
    recorder.addEventListener("dataavailable", handleData);
    return () => recorder.removeEventListener("dataavailable", handleData);
  }, [recorder, isRecording]);

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const resetRecording = () => {
    setAudioURL("");
    setNewBlob(null);
  };

  return [
    audioURL,
    isRecording,
    startRecording,
    stopRecording,
    newBlob,
    resetRecording,
  ];
};

async function requestRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return new MediaRecorder(stream);
}
export default useRecorder;
