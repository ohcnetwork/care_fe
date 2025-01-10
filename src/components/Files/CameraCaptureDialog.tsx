import { t } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import DialogModal from "@/components/Common/Dialog";

import useBreakpoints from "@/hooks/useBreakpoints";

export interface CameraCaptureDialogProps {
  show: boolean;
  onHide: () => void;
  onCapture: (file: File, fileName: string) => void;
  onResetCapture: () => void;
}

export default function CameraCaptureDialog(props: CameraCaptureDialogProps) {
  const { show, onHide, onCapture, onResetCapture } = props;
  const isLaptopScreen = useBreakpoints({ lg: true, default: false });

  const [cameraFacingMode, setCameraFacingMode] = useState(
    isLaptopScreen ? "user" : "environment",
  );
  const [previewImage, setPreviewImage] = useState(null);
  const webRef = useRef<any>(null);

  const videoConstraints = {
    width: { ideal: 4096 },
    height: { ideal: 2160 },
    facingMode: cameraFacingMode,
  };
  useEffect(() => {
    if (!show) return;
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: cameraFacingMode } })
      .then((mediaStream) => {
        stream = mediaStream;
      })
      .catch(() => {
        toast.warning(t("camera_permission_denied"));
        onHide();
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [show, cameraFacingMode, onHide]);

  const handleSwitchCamera = useCallback(async () => {
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
      toast.warning(t("switch_camera_is_not_available"));
    }
  }, []);

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
            <Button
              variant="primary"
              onClick={handleSwitchCamera}
              className="m-2"
            >
              {t("switch")}
            </Button>
          ) : (
            <></>
          )}
        </div>
        <div>
          {!previewImage ? (
            <>
              <div>
                <Button
                  variant="primary"
                  onClick={() => {
                    captureImage();
                  }}
                  className="m-2"
                >
                  {t("capture")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex space-x-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setPreviewImage(null);
                    onResetCapture();
                  }}
                  className="m-2"
                >
                  {t("retake")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setPreviewImage(null);
                    onHide();
                  }}
                  className="m-2"
                >
                  {t("submit")}
                </Button>
              </div>
            </>
          )}
        </div>
        <div className="sm:flex-1">
          <Button
            variant="outline"
            onClick={() => {
              setPreviewImage(null);
              onResetCapture();
              onHide();
            }}
            className="m-2"
          >
            {t("close")}
          </Button>
        </div>
      </div>
      {/* buttons for laptop screens */}
      <div className={`${isLaptopScreen ? " " : "hidden"}`}>
        <div className="m-4 flex lg:hidden">
          <Button variant="primary" onClick={handleSwitchCamera}>
            <CareIcon icon="l-camera-change" className="text-lg" />
            {`${t("switch")} ${t("camera")}`}
          </Button>
        </div>

        <div className="flex justify-end gap-2 p-4">
          <div>
            {!previewImage ? (
              <>
                <div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      captureImage();
                    }}
                  >
                    <CareIcon icon="l-capture" className="text-lg" />
                    {t("capture")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setPreviewImage(null);
                      onResetCapture();
                    }}
                  >
                    {t("retake")}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      onHide();
                      setPreviewImage(null);
                    }}
                  >
                    {t("submit")}
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="sm:flex-1" />
          <Button
            variant="outline"
            onClick={() => {
              setPreviewImage(null);
              onResetCapture();
              onHide();
            }}
          >
            {`${t("close")} ${t("camera")}`}
          </Button>
        </div>
      </div>
    </DialogModal>
  );
}
