import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { useMediaStream } from "@/hooks/useMediaStream";

import { useMediaDevicePermission } from "@/Utils/useMediaDevicePermission";

const VideoConstraints = {
  user: {
    width: {
      min: 400,
      max: 1024,
    },
    height: {
      min: 400,
      max: 1024,
    },
    facingMode: "user",
  },
  environment: {
    width: {
      min: 400,
      max: 1024,
    },
    height: {
      min: 400,
      max: 1024,
    },
    facingMode: "environment",
  },
} as const;

type IVideoConstraint =
  (typeof VideoConstraints)[keyof typeof VideoConstraints];

interface CameraCaptureProps {
  isCameraOpen: boolean;
  previewImage: string | null;
  isProcessing: boolean;
  isCaptureImgBeingUploaded: boolean;
  uploadAvatar: () => void;
  setPreviewImage: React.Dispatch<React.SetStateAction<string | null>>;
  setIsCameraOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | undefined>>;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  isCameraOpen,
  previewImage,
  isProcessing,
  isCaptureImgBeingUploaded,
  uploadAvatar,
  setPreviewImage,
  setIsCameraOpen,
  setSelectedFile,
}) => {
  const { t } = useTranslation();
  const webRef = useRef<Webcam>(null);
  const [constraint, setConstraint] = useState<IVideoConstraint>(
    VideoConstraints.user,
  );
  const { requestPermission } = useMediaDevicePermission();
  const { startStream, stopStream } = useMediaStream({
    constraints: { video: { facingMode: constraint.facingMode } },
  });

  const handleSwitchCamera = useCallback(() => {
    setConstraint(
      constraint.facingMode === "user"
        ? VideoConstraints.environment
        : VideoConstraints.user,
    );
  }, [constraint.facingMode]);
  const captureImage = () => {
    if (webRef.current) {
      setPreviewImage(webRef.current.getScreenshot());
      const canvas = webRef.current.getCanvas();
      canvas?.toBlob((blob: Blob | null) => {
        if (!blob) return;
        const extension = blob.type.split("/").pop();
        const myFile = new File([blob], `capture.${extension}`, {
          type: blob.type,
        });
        setSelectedFile(myFile);
      });
    }
  };
  const handleClose = () => {
    setIsCameraOpen(false);
    setPreviewImage(null);
  };
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCameraOpen) {
      timer = setTimeout(() => {
        startStream();
      }, 100);
    }

    return () => {
      clearTimeout(timer);
      stopStream();
    };
  }, [isCameraOpen]);

  return (
    <>
      <div className="flex flex-1 items-center justify-center">
        {!previewImage ? (
          <Webcam
            forceScreenshotSourceSize
            screenshotQuality={1}
            audio={false}
            screenshotFormat="image/jpeg"
            ref={webRef}
            videoConstraints={{
              ...constraint,
              width: {
                ...constraint.width,
                ideal: window.innerWidth,
              },
              height: {
                ...constraint.height,
                ideal: window.innerHeight,
              },
            }}
            id="front-camera-webcam"
            title="Webcam - Front Camera"
            onUserMediaError={async () => {
              const requestValue = await requestPermission({
                video: { facingMode: "user" },
              });
              if (!requestValue.hasPermission) {
                handleClose();
              }
            }}
          />
        ) : (
          <img src={previewImage} alt="Captured" />
        )}
      </div>

      {/* Buttons for mobile screens */}
      <div className="flex flex-col gap-2 pt-4 sm:flex-row">
        {!previewImage ? (
          <>
            <Button variant="primary" onClick={handleSwitchCamera}>
              <CareIcon icon="l-camera-change" className="text-lg" />
              {`${t("switch")} ${t("camera")}`}
            </Button>
            <Button variant="primary" onClick={captureImage}>
              <CareIcon icon="l-capture" className="text-lg" />
              {t("capture")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={() => setPreviewImage(null)}>
              {t("retake")}
            </Button>
            <Button
              variant="primary"
              disabled={isProcessing}
              onClick={uploadAvatar}
            >
              {isCaptureImgBeingUploaded ? (
                <>
                  <CareIcon icon="l-spinner" className="animate-spin text-lg" />
                  {`${t("submitting")}...`}
                </>
              ) : (
                <>{t("submit")}</>
              )}
            </Button>
          </>
        )}
        <div className="sm:flex-1"></div>
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isProcessing}
        >
          {t("close")}
        </Button>
      </div>
    </>
  );
};

export default CameraCapture;
