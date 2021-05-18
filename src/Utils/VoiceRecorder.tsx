import * as React from "react";
import useRecorder from "./useRecorder";
import { Button } from "@material-ui/core";
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
export const VoiceRecorder = (props: any) => {

  const { createAudioBlob } = props;
  let [audioURL, isRecording, startRecording, stopRecording, newBlob] = useRecorder();

  createAudioBlob(newBlob);

  return (
    <div >
      <em>Please allow browser permission before you start speaking</em>
      <audio src={audioURL} controls />
      <Button
        color="primary"
        variant="contained"
        style={{ marginLeft: "auto" }}
        startIcon={<MicIcon />}
        onClick={
          startRecording
        }
        disabled={isRecording}
      >
        Start
      </Button>
      <Button
        color="primary"
        variant="contained"
        style={{ marginLeft: "auto" }}
        startIcon={<MicOffIcon />}
        onClick={
          stopRecording
        }
        disabled={!isRecording}
      >
        Stop
      </Button>
    </div>
  );
}
