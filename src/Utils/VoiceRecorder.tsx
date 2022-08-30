import * as React from "react";
import useRecorder from "./useRecorder";
import { Button } from "@material-ui/core";
import MicIcon from "@material-ui/icons/Mic";
import MicOffIcon from "@material-ui/icons/MicOff";
import { useEffect, useState } from "react";
export const VoiceRecorder = (props: any) => {
  const { createAudioBlob } = props;
  const [audioURL, isRecording, startRecording, stopRecording, newBlob] =
    useRecorder();
  const [time, setTime] = useState(0);
  createAudioBlob(newBlob);
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else {
      clearInterval(interval);
      setTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div>
      <div className="text-xs">
        Please allow browser permission before you start speaking
      </div>
      <div className="mt-2">
        {isRecording ? (
          <>
            <div className="space-x-2 flex">
              <div className="bg-gray-100 p-2 text-primary-700">
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
            <div className="mx-3">
              <span>{("0" + Math.floor((time / 60000) % 60)).slice(-2)}:</span>
              <span>{("0" + Math.floor((time / 1000) % 60)).slice(-2)}</span>
            </div>
          </>
        ) : (
          <Button
            color="primary"
            variant="contained"
            style={{ marginLeft: "auto" }}
            startIcon={<MicIcon />}
            onClick={startRecording}
            fullWidth
            className="w-full md:w-auto"
            disabled={isRecording}
          >
            {audioURL ? "Re-Record" : "Record"}
          </Button>
        )}
      </div>
      {audioURL && (
        <div className="my-4">
          <audio
            className="max-h-full max-w-full m-auto object-contain"
            src={audioURL}
            controls
          />
        </div>
      )}
    </div>
  );
};
