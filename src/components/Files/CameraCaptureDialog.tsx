import { t } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import CameraMenu from "@/components/Common/CameraSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import { useMediaDevicePermission } from "@/Utils/useMediaDevicePermission";

export interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File, fileName: string) => void;
  onResetCapture: () => void;
  setPreview?: (isPreview: boolean) => void;
}

export default function CameraCaptureDialog(props: CameraCaptureDialogProps) {
  const { open, onOpenChange, onCapture, onResetCapture, setPreview } = props;
  const isLaptopScreen = useBreakpoints({ lg: true, default: false });
  const { requestPermission } = useMediaDevicePermission();
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [cameraFacingMode, setCameraFacingMode] = useState(
    isLaptopScreen ? "user" : "environment",
  );
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [previewImage, setPreviewImage] = useState(null);
  const webRef = useRef<any>(null);

  useEffect(() => {
    if (!open) return;

    const getCameraStream = async () => {
      const hasPermission = await requestPermission(cameraFacingMode);
      if (!hasPermission.hasPermission) {
        onOpenChange(false);
        return;
      }

      try {
        const mediaStream = hasPermission.mediaStream;
        setStream(mediaStream);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    getCameraStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [open, cameraFacingMode, onOpenChange]);

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
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0">
        <DialogHeader>
          <DialogTitle>
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
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="flex justify-end">
            <CameraMenu
              onChange={(deviceId) => setSelectedDeviceId(deviceId)}
              onSwitchCamera={handleSwitchCamera}
            />
          </div>
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
                    width: { ideal: 4096 },
                    height: { ideal: 2160 },
                    ...(selectedDeviceId
                      ? { deviceId: { exact: selectedDeviceId } }
                      : { facingMode: cameraFacingMode }),
                  }}
                />
              </div>
            ) : (
              <div className="m-3">
                <img src={previewImage} alt="captured" />
              </div>
            )}
          </div>
        </div>

        {/* buttons for mobile and tablet screens */}
        <div className="m-4 flex justify-evenly lg:hidden">
          <div>
            {!previewImage ? (
              <>
                <div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      captureImage();
                      setPreview?.(true);
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
                      setPreview?.(false);
                    }}
                    className="m-2"
                  >
                    {t("retake")}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setPreviewImage(null);
                      stopCamera();
                      onOpenChange(false);
                      setPreview?.(false);
                    }}
                    className="m-2"
                  >
                    {t("submit")}
                  </Button>
                </div>
              </>
            )}
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewImage(null);
                onResetCapture();
                stopCamera();
                onOpenChange(false);
              }}
              className="m-2"
            >
              {t("close")}
            </Button>
          </div>
        </div>

        {/* buttons for laptop screens */}
        <div className="hidden lg:block">
          <div className="flex justify-end gap-2 p-4">
            <div>
              {!previewImage ? (
                <>
                  <div>
                    <Button
                      variant="primary"
                      onClick={() => {
                        captureImage();
                        setPreview?.(true);
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
                        setPreview?.(false);
                      }}
                    >
                      {t("retake")}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        onOpenChange(false);
                        setPreviewImage(null);
                        stopCamera();
                        setPreview?.(false);
                      }}
                    >
                      {t("submit")}
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={() => {
                setPreviewImage(null);
                onResetCapture();
                stopCamera();
                onOpenChange(false);
                setPreview?.(false);
              }}
            >
              {`${t("close")} ${t("camera")}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
