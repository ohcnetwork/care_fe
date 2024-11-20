import { t } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2, { Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";

import useWindowDimensions from "@/hooks/useWindowDimensions";

import * as Notify from "@/Utils/Notifications";

export interface CameraCaptureDialogProps {
  show: boolean;
  onHide: () => void;
  onCapture: (file: File, fileName: string) => void;
}

export default function CameraCaptureDialog(props: CameraCaptureDialogProps) {
  const { show, onHide, onCapture } = props;
  const { width } = useWindowDimensions();
  const LaptopScreenBreakpoint = 640;
  const isLaptopScreen = width >= LaptopScreenBreakpoint ? true : false;

  const [cameraFacingMode, setCameraFacingMode] = useState(
    isLaptopScreen ? "user" : "environment",
  );
  const [previewImage, setPreviewImage] = useState(null);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const webRef = useRef<any>(null);

  const videoConstraints = {
    width: { ideal: 4096 },
    height: { ideal: 2160 },
    facingMode: cameraFacingMode,
  };
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacingMode },
        });
        activeStream = stream;
      } catch (error) {
        Notify.Warn({
          msg: t("camera_permission_denied"),
        });
        onHide();
      }
    };

    initializeCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          activeStream?.removeTrack(track);
          track.stop();
        });
      }
    };
  }, [show, cameraFacingMode]);

  const handleUserMedia = useCallback(
    (stream: MediaStream) => {
      // Stop the previous stream's tracks if any
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          stream.removeTrack(track);
          track.stop();
        });
      }

      // Set the new stream
      setCurrentStream(stream);
      // Attach the new stream to the video element
      if (webRef.current && webRef.current.video) {
        webRef.current.video.srcObject = stream;
      }
    },
    [currentStream],
  );

  const handleSwitchCamera = useCallback(async () => {
    // Stop the current stream before switching
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        currentStream.removeTrack(track);
        track.stop();
      });
    }

    // Get the available video input devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(
      (device) => device.kind === "videoinput",
    );

    const backCamera = videoInputs.some((device) =>
      device.label.toLowerCase().includes("back"),
    );

    if (!isLaptopScreen && backCamera) {
      setCameraFacingMode((prevMode) =>
        prevMode === "environment" ? "user" : "environment",
      );
    } else {
      Notify.Warn({
        msg: t("switch_camera_is_not_available"),
      });
    }
  }, [isLaptopScreen, currentStream]);

  useEffect(() => {
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          currentStream.removeTrack(track);
          track.stop();
        });
      }
    };
  }, [currentStream]);

  const captureImage = () => {
    setPreviewImage(webRef.current.getScreenshot());
    const canvas = webRef.current.getCanvas();
    canvas?.toBlob((blob: Blob) => {
      const extension = blob.type.split("/").pop();
      const myFile = new File([blob], `capture.${extension}`, {
        type: blob.type,
      });
      onCapture(myFile, `capture.${extension}`);
    });
  };

  return (
    <DialogModal
      show={show}
      title={
        <div className="flex flex-row">
          <div className="rounded-full bg-primary-100 px-5 py-4">
            <CareIcon
              icon="l-camera-change"
              className="text-lg text-primary-500"
            />
          </div>
          <div className="m-4">
            <h1 className="text-xl text-black">{t("camera")}</h1>
          </div>
        </div>
      }
      className="max-w-2xl"
      onClose={onHide}
    >
      <div>
        {!previewImage ? (
          <div className="m-3">
            <Webcam
              forceScreenshotSourceSize
              screenshotQuality={1}
              audio={false}
              screenshotFormat="image/jpeg"
              ref={webRef}
              videoConstraints={{
                ...videoConstraints,
                facingMode: cameraFacingMode,
              }}
              onUserMedia={(stream) => handleUserMedia(stream)}
            />
          </div>
        ) : (
          <div className="m-3">
            <img src={previewImage} />
          </div>
        )}
      </div>

      {/* buttons for mobile screens */}
      <div className="m-4 flex justify-evenly sm:hidden">
        <div>
          {!previewImage ? (
            <ButtonV2 onClick={handleSwitchCamera} className="m-2">
              {t("switch")}
            </ButtonV2>
          ) : (
            <></>
          )}
        </div>
        <div>
          {!previewImage ? (
            <>
              <div>
                <ButtonV2
                  onClick={() => {
                    captureImage();
                  }}
                  className="m-2"
                >
                  {t("capture")}
                </ButtonV2>
              </div>
            </>
          ) : (
            <>
              <div className="flex space-x-2">
                <ButtonV2
                  onClick={() => {
                    setPreviewImage(null);
                  }}
                  className="m-2"
                >
                  {t("retake")}
                </ButtonV2>
                <Submit
                  onClick={() => {
                    setPreviewImage(null);
                    onHide();
                  }}
                  className="m-2"
                >
                  {t("submit")}
                </Submit>
              </div>
            </>
          )}
        </div>
        <div className="sm:flex-1">
          <ButtonV2
            variant="secondary"
            onClick={() => {
              setPreviewImage(null);
              onHide();
            }}
            className="m-2"
          >
            {t("close")}
          </ButtonV2>
        </div>
      </div>
      {/* buttons for laptop screens */}
      <div className={`${isLaptopScreen ? " " : "hidden"}`}>
        <div className="m-4 flex lg:hidden">
          <ButtonV2 onClick={handleSwitchCamera}>
            <CareIcon icon="l-camera-change" className="text-lg" />
            {`${t("switch")} ${t("camera")}`}
          </ButtonV2>
        </div>

        <div className="flex justify-end gap-2 p-4">
          <div>
            {!previewImage ? (
              <>
                <div>
                  <ButtonV2
                    onClick={() => {
                      captureImage();
                    }}
                  >
                    <CareIcon icon="l-capture" className="text-lg" />
                    {t("capture")}
                  </ButtonV2>
                </div>
              </>
            ) : (
              <>
                <div className="flex space-x-2">
                  <ButtonV2
                    onClick={() => {
                      setPreviewImage(null);
                    }}
                  >
                    {t("retake")}
                  </ButtonV2>
                  <Submit
                    onClick={() => {
                      onHide();
                      setPreviewImage(null);
                    }}
                  >
                    {t("submit")}
                  </Submit>
                </div>
              </>
            )}
          </div>
          <div className="sm:flex-1" />
          <ButtonV2
            variant="secondary"
            onClick={() => {
              setPreviewImage(null);
              onHide();
            }}
          >
            {`${t("close")} ${t("camera")}`}
          </ButtonV2>
        </div>
      </div>
    </DialogModal>
  );
}
