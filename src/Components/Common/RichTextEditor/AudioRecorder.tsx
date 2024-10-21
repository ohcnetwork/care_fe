import CareIcon from "../../../CAREUI/icons/CareIcon";
import useRecorder from "../../../Utils/useRecorder";
import ButtonV2 from "../components/ButtonV2";
import { useEffect, useState } from "react";

const AudioRecorder = ({
  setFile,
  modalOpenForAudio,
  setModalOpenForAudio,
}: {
  setFile: (file: File) => void;
  modalOpenForAudio: boolean;
  setModalOpenForAudio: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [audioBlobExists, setAudioBlobExists] = useState(false);
  const [resetAudioRecording, setAudioResetRecording] = useState(false);
  const [isMicPermission, setIsMicPermission] = useState(true);
  const [audioBlob, setAudioBlob] = useState<Blob>();

  const handleAudioUpload = () => {
    if (!audioBlob) return;
    const f = new File([audioBlob], "audio.mp3", {
      type: audioBlob.type,
    });
    setFile(f);
    deleteAudioBlob();
  };

  useEffect(() => {
    if (modalOpenForAudio) {
      setAudioBlobExists(false);
      setAudioResetRecording(true);
      startRecording();
    }
  }, [modalOpenForAudio]);

  const [
    audioURL,
    isRecording,
    startRecording,
    stopRecording,
    newBlob,
    resetRecording,
  ] = useRecorder(setIsMicPermission);
  const [time, setTime] = useState(0);
  useEffect(() => {
    setAudioBlob(newBlob);
    let interval: number | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else {
      clearInterval(interval);
      setTime(0);
    }
    if (resetAudioRecording) {
      resetRecording();
      setAudioResetRecording(false);
    }
    return () => clearInterval(interval);
  }, [isRecording, newBlob, resetAudioRecording]);

  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const permissions = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setIsMicPermission(permissions.state === "granted");
      } catch (error) {
        setIsMicPermission(false);
      }
    };

    checkMicPermission();

    return () => {
      setIsMicPermission(true);
    };
  }, []);

  const deleteAudioBlob = () => {
    setAudioBlobExists(false);
    setAudioResetRecording(true);
    setModalOpenForAudio(false);
  };

  return (
    <div className="flex w-full flex-col items-center justify-between gap-2 lg:flex-row">
      {audioBlobExists && (
        <div className="flex w-full items-center md:w-auto">
          <ButtonV2
            variant="danger"
            className="w-full"
            onClick={() => {
              deleteAudioBlob();
            }}
          >
            <CareIcon icon="l-trash" className="h-4" /> Delete
          </ButtonV2>
        </div>
      )}
      <div className="flex flex-col items-center gap-4 md:flex-row md:flex-wrap lg:flex-nowrap">
        <div className="w-full md:w-auto">
          <div>
            {isRecording && (
              <>
                <div className="flex justify-end space-x-2">
                  <div className="flex bg-gray-100 p-2 text-primary-700">
                    <CareIcon
                      icon="l-record-audio"
                      className="mr-2 animate-pulse"
                    />
                    <div className="mx-2">
                      (
                      <span>
                        {("0" + Math.floor((time / 60000) % 60)).slice(-2)}:
                      </span>
                      <span>
                        {("0" + Math.floor((time / 1000) % 60)).slice(-2)}
                      </span>
                      )
                    </div>
                    recording...
                  </div>
                  <ButtonV2
                    onClick={() => {
                      stopRecording();
                      setAudioBlobExists(true);
                    }}
                  >
                    <CareIcon icon="l-microphone-slash" className="text-lg" />
                    stop
                  </ButtonV2>
                </div>
              </>
            )}
          </div>
          {audioURL && audioBlobExists && (
            <div className="my-4">
              <audio
                className="m-auto max-h-full max-w-full object-contain"
                src={audioURL}
                controls
              />{" "}
            </div>
          )}
        </div>

        {!audioBlobExists && !isMicPermission && (
          <span className="text-sm font-medium text-warning-500">
            <CareIcon
              icon="l-exclamation-triangle"
              className="mr-1 text-base"
            />
            Please allow browser permission before you start speaking
          </span>
        )}
      </div>
      {audioBlobExists && (
        <div className="flex w-full items-center md:w-auto">
          <ButtonV2 onClick={handleAudioUpload} className="w-full">
            <CareIcon icon="l-cloud-upload" className="text-xl" />
            Save
          </ButtonV2>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
