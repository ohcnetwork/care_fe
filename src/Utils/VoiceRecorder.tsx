import useRecorder from "./useRecorder";
import { useEffect, useState } from "react";
import ButtonV2 from "../Components/Common/components/ButtonV2";
import CareIcon from "../CAREUI/icons/CareIcon";
import { NonReadOnlyUsers } from "./AuthorizeFor";
import { useTranslation } from "react-i18next";
export const VoiceRecorder = (props: any) => {
  const { t } = useTranslation();
  const { createAudioBlob, confirmAudioBlobExists, reset, setResetRecording } =
    props;
  const [
    audioURL,
    isRecording,
    startRecording,
    stopRecording,
    newBlob,
    resetRecording,
  ] = useRecorder();
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
    if (reset) {
      resetRecording();
      setResetRecording(false);
    }
    return () => clearInterval(interval);
  }, [isRecording, reset, setResetRecording, resetRecording]);

  return (
    <div>
      <div>
        {isRecording ? (
          <>
            <div className="flex space-x-2">
              <div className="bg-gray-100 p-2 text-primary-700">
                <CareIcon className="care-l-record-audio mr-2 animate-pulse" />
                {t("recording") + "..."}
              </div>
              <ButtonV2
                onClick={() => {
                  stopRecording();
                  confirmAudioBlobExists();
                }}
              >
                <CareIcon className="care-l-microphone-slash text-lg" />
                {t("stop")}
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
              <ButtonV2
                onClick={startRecording}
                authorizeFor={NonReadOnlyUsers}
                className="w-full md:w-fit"
              >
                <CareIcon className="care-l-microphone text-lg" />
                {t("record")}
              </ButtonV2>
            )}
          </div>
        )}
      </div>
      {audioURL && (
        <div className="my-4">
          <audio
            className="m-auto max-h-full max-w-full object-contain"
            src={audioURL}
            controls
          />{" "}
        </div>
      )}
    </div>
  );
};
