import * as React from "react";
import useRecorder from "./useRecorder";
import { Button } from "@material-ui/core";
import MicIcon from "@material-ui/icons/Mic";
import MicOffIcon from "@material-ui/icons/MicOff";
export const VoiceRecorder = (props: any) => {
  const { createAudioBlob } = props;
  let [audioURL, isRecording, startRecording, stopRecording, newBlob] =
    useRecorder();

  createAudioBlob(newBlob);

  return (
    <div>
      <div className="text-xs">
        Please allow browser permission before you start speaking
      </div>
      <div className="mt-2">
        {isRecording ? (
          <div className="space-x-2 flex">
            <div className="bg-gray-100 p-2 text-green-700">
              <i className="fas fa-microphone-alt animate-pulse mr-2"></i>
              Recording...
            </div>
            <Button
              color="primary"
              variant="contained"
              style={{ marginLeft: "auto" }}
              startIcon={<MicOffIcon />}
              onClick={stopRecording}
              disabled={!isRecording}
            >
              Stop
            </Button>
          </div>
        ) : (
          <Button
            color="primary"
            variant="contained"
            style={{ marginLeft: "auto" }}
            startIcon={<MicIcon />}
            onClick={startRecording}
            disabled={isRecording}
          >
            {audioURL ? "Re-Record" : "Record"}
          </Button>
        )}
      </div>
      {audioURL && (
        <div className="my-4">
          <audio src={audioURL} controls />{" "}
        </div>
      )}
    </div>
  );
};
