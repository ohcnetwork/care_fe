import * as React from "react";
import useRecorder from "./useRecorder";
import { Button } from "@material-ui/core";
export const VoiceRecorder = (props: any) => {

  const { createAudioBlob } = props;
  let [audioURL, isRecording, startRecording, stopRecording, newBlob] = useRecorder();

  createAudioBlob(newBlob);

  return (
    <div >
      <audio src={audioURL} controls />
      <button onClick={startRecording} disabled={isRecording}>
        start recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        stop recording
      </button>
    </div>
  );
}
