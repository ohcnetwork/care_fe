import * as React from "react";
import useRecorder from "./useRecorder";
import { useEffect, useState } from "react";
import ButtonV2 from "../Components/Common/components/ButtonV2";
import CareIcon from "../CAREUI/icons/CareIcon";
export const VoiceRecorder = (props: any) => {
  const { createAudioBlob } = props;
  const [audioURL, isRecording, startRecording, stopRecording, newBlob] =
    useRecorder();
  const [time, setTime] = useState(0);
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
      <div>
        {isRecording ? (
          <>
            <div className="space-x-2 flex">
              <div className="bg-gray-100 p-2 text-primary-700">
                <i className="fas fa-microphone-alt animate-pulse mr-2"></i>
                Recording...
              </div>
              <ButtonV2
                onClick={() => {
                  stopRecording();
                  createAudioBlob(newBlob);
                }}
              >
                <CareIcon className={"care-l-microphone-slash text-lg"} />
                Stop
              </ButtonV2>
            </div>
            <div className="mx-3">
              <span>{("0" + Math.floor((time / 60000) % 60)).slice(-2)}:</span>
              <span>{("0" + Math.floor((time / 1000) % 60)).slice(-2)}</span>
            </div>
          </>
        ) : (
          <div>
            {!audioURL && (
              <ButtonV2 onClick={startRecording}>
                <CareIcon className={"care-l-microphone text-lg"} />
                Record
              </ButtonV2>
            )}
          </div>
        )}
      </div>
      {audioURL && (
        <div className="my-4">
          <audio
            className="max-h-full max-w-full m-auto object-contain"
            src={audioURL}
            controls
          />{" "}
        </div>
      )}
    </div>
  );
};
