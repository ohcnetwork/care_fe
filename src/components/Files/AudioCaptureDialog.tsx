import { Link } from "raviger";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { useTimer } from "@/hooks/useTimer";

import useVoiceRecorder from "@/Utils/useVoiceRecorder";

export interface AudioCaptureDialogProps {
  show: boolean;
  onHide: () => void;
  onCapture: (file: File, fileName: string) => void;
  autoRecord?: boolean;
}

export default function AudioCaptureDialog(props: AudioCaptureDialogProps) {
  type Status =
    | "RECORDING"
    | "WAITING_TO_RECORD"
    | "PERMISSION_DENIED"
    | "RECORDED";

  const { show, onHide, onCapture, autoRecord = false } = props;
  const [status, setStatus] = useState<Status | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const { t } = useTranslation();

  const { audioURL, resetRecording, startRecording, stopRecording } =
    useVoiceRecorder((permission: boolean) => {
      if (!permission) {
        handleStopRecording();
        resetRecording();
        setStatus("PERMISSION_DENIED");
      }
    });

  const timer = useTimer();

  const handleStartRecording = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStreamRef.current = stream;
        setStatus("RECORDING");
        startRecording();
        timer.start();
      })
      .catch(() => {
        toast.error(t("audio__permission_message"));
        setStatus("PERMISSION_DENIED");
      });
  };

  const handleStopRecording = () => {
    if (status !== "RECORDING") return;
    setStatus("RECORDED");
    stopRecording();
    timer.stop();
  };

  const handleRestartRecording = () => {
    if (status !== "RECORDED") return;
    resetRecording();
    handleStartRecording();
  };

  const handleSubmit = async () => {
    const response = await fetch(audioURL);
    const blob = await response.blob();
    const fileName = `recording_${new Date().toISOString().replaceAll(".", "_").replaceAll(":", "_")}.mp3`;
    const file = new File([blob], fileName, { type: "audio/mpeg" });
    resetRecording();
    onHide();
    onCapture(file, fileName);
  };

  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const permissions = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setStatus(
          permissions.state === "denied"
            ? "PERMISSION_DENIED"
            : "WAITING_TO_RECORD",
        );
      } catch {
        setStatus(null);
      }
    };

    if (show) checkMicPermission();

    return () => {
      setStatus(null);
    };
  }, [show]);

  useEffect(() => {
    if (autoRecord && show && status === "RECORDING") {
      handleStartRecording();
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [autoRecord, status, show]);

  return (
    <div
      className={`inset-0 bg-black/70 backdrop-blur-sm transition-all ${show ? "visible opacity-100" : "invisible opacity-0"} fixed z-50 flex flex-col items-center justify-center gap-8 p-6 text-center`}
    >
      {status === "PERMISSION_DENIED" && (
        <div>
          <h2 className="font-bold text-white">
            {t("audio__allow_permission")}
          </h2>
          <div className="text-secondary-200">
            {t("audio__allow_permission_helper")}{" "}
            {/* TODO: find a better link that supports all browsers */}
            <Link
              href="https://support.google.com/chrome/answer/2693767?hl=en&co=GENIE.Platform%3DAndroid"
              target="_blank"
              className="text-blue-400 underline"
            >
              {t("audio__allow_permission_button")}
            </Link>
          </div>
        </div>
      )}
      {status === "WAITING_TO_RECORD" && (
        <div>
          <h2 className="font-bold text-white">{t("audio__record")}</h2>
          <div className="text-secondary-200">{t("audio__record_helper")}</div>
          <div className="mt-4" id="start-recording">
            <button
              onClick={handleStartRecording}
              className="inline-flex aspect-square w-32 items-center justify-center rounded-full bg-white/10 text-6xl text-white hover:bg-white/20"
            >
              <CareIcon icon="l-microphone" />
            </button>
          </div>
        </div>
      )}
      {status === "RECORDING" && (
        <div>
          <h2 className="inline-flex animate-pulse items-center gap-2 font-bold text-red-500">
            <div className="aspect-square w-5 rounded-full bg-red-500" />
            {t("audio__recording")}
          </h2>
          <div className="text-secondary-200">
            {t("audio__recording_helper")}
            <br />
            {t("audio__recording_helper_2")}
          </div>
          <div className="mt-4">
            <button
              onClick={handleStopRecording}
              id="stop-recording"
              className="inline-flex aspect-square w-32 animate-pulse items-center justify-center rounded-full bg-red-500/20 text-2xl text-red-500 hover:bg-red-500/30"
            >
              {timer.time}
            </button>
          </div>
        </div>
      )}
      {status === "RECORDED" && (
        <div>
          <h2 className="font-bold text-white">{t("audio__recorded")}</h2>
          <div className="text-secondary-200">
            {audioURL && (
              <div className="my-4">
                <audio
                  className="m-auto max-h-full max-w-full object-contain"
                  src={audioURL}
                  controls
                  autoPlay
                />
              </div>
            )}
          </div>
          <div className="mt-4 inline-flex items-center gap-2">
            <button
              onClick={handleSubmit}
              className="rounded-md bg-primary-500 px-4 py-2 text-white transition-all hover:bg-primary-600"
              id="save-recording"
            >
              <CareIcon icon="l-check" className="mr-2 text-lg" />
              {t("done")}
            </button>
            <button
              onClick={handleRestartRecording}
              className="rounded-md bg-white/10 px-4 py-2 text-white transition-all hover:bg-white/20"
            >
              <CareIcon icon="l-history" className="mr-2 text-lg" />
              {t("audio__start_again")}
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => {
          handleStopRecording();
          onHide();
          resetRecording();
        }}
        className="rounded-md bg-white/10 px-4 py-2 text-white transition-all hover:bg-white/20"
      >
        <CareIcon icon="l-times" className="mr-2 text-lg" />
        {t("cancel")}
      </button>
    </div>
  );
}
