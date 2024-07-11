import useRecorder from "./useRecorder";
import { useEffect, useState } from "react";
import ButtonV2 from "../Components/Common/components/ButtonV2";
import CareIcon from "../CAREUI/icons/CareIcon";
import { NonReadOnlyUsers } from "./AuthorizeFor";
import { useTranslation } from "react-i18next";

export const VoiceRecorder = (props: any) => {
  const { t } = useTranslation();
  const {
    isDisabled,
    createAudioBlob,
    confirmAudioBlobExists,
    reset,
    setResetRecording,
    handleSetMicPermission,
  } = props;
  const [
    audioURL,
    isRecording,
    startRecording,
    stopRecording,
    newBlob,
    resetRecording,
  ] = useRecorder(handleSetMicPermission);
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
    <div className="w-full md:w-auto">
      <div>
        {isRecording ? (
          <>
            <div className="flex space-x-2">
              <div className="bg-secondary-100 p-2 text-primary-700">
                <CareIcon
                  icon="l-record-audio"
                  className="mr-2 animate-pulse"
                />
                {t("recording") + "..."}
              </div>
              <ButtonV2
                id="stop-recording"
                onClick={() => {
                  stopRecording();
                  confirmAudioBlobExists();
                }}
              >
                <CareIcon icon="l-microphone-slash" className="text-lg" />
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
                id="record-audio"
                disabled={isDisabled}
                onClick={startRecording}
                authorizeFor={NonReadOnlyUsers}
                className="w-full md:w-fit"
              >
                <CareIcon icon="l-microphone" className="text-lg" />
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
