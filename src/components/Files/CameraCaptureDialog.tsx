import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Check, RotateCcw, SwitchCamera, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import useBreakpoints from "@/hooks/useBreakpoints";
import { useMediaStream } from "@/hooks/useMediaStream";

export interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File, fileName: string) => void;
  onResetCapture: () => void;
  setPreview?: (isPreview: boolean) => void;
}

const lastUsedCameraDeviceIdAtom = atomWithStorage<string | null>(
  "last_used_camera_device_id",
  null,
);

export default function CameraCaptureDialog(props: CameraCaptureDialogProps) {
  const { t } = useTranslation();

  const { open, onOpenChange, onCapture, onResetCapture, setPreview } = props;
  const isLaptopScreen = useBreakpoints({ lg: true, default: false });
  const [cameraFacingMode, setCameraFacingMode] = useState("environment");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useAtom(
    lastUsedCameraDeviceIdAtom,
  );
  const webRef = useRef<Webcam>(null);

  const videoConstraints =
    isLaptopScreen && selectedDeviceId
      ? { deviceId: selectedDeviceId }
      : { facingMode: cameraFacingMode };

  const { startStream, stopStream, devices } = useMediaStream({
    constraints: {
      video: videoConstraints,
    },
  });

  const videoDevices = devices.filter((device) => device.kind === "videoinput");

  useEffect(() => {
    if (videoDevices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(videoDevices[0].deviceId);
    }
  }, [videoDevices, selectedDeviceId, setSelectedDeviceId]);

  const handleSwitchCamera = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(
      (device) => device.kind === "videoinput",
    );
    const backCamera = videoInputs.some((device) =>
      device.label.toLowerCase().includes("back"),
    );

    if (backCamera) {
      setCameraFacingMode((prevMode) =>
        prevMode === "environment" ? "user" : "environment",
      );
    } else {
      toast.warning(t("switch_camera_is_not_available"));
    }
  }, [setCameraFacingMode]);

  const captureImage = () => {
    if (!webRef.current) return;
    const screenshot = webRef.current.getScreenshot();
    setPreviewImage(screenshot);
    const canvas = webRef.current.getCanvas();
    canvas?.toBlob((blob: Blob | null) => {
      if (!blob) return;
      const extension = blob.type.split("/").pop();
      const myFile = new File([blob], `capture.${extension}`, {
        type: blob.type,
      });
      onCapture(myFile, `capture.${extension}`);
    });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open) {
      timer = setTimeout(() => {
        startStream();
      }, 100);
    }

    return () => {
      clearTimeout(timer);
      stopStream();
    };
  }, [open]);

  const handleClose = () => {
    setPreviewImage(null);
    onResetCapture();
    onOpenChange(false);
    setCameraFacingMode("environment");
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[100vh] w-full p-0">
        <div className="relative h-full">
          {!previewImage ? (
            <div className="h-full">
              <Webcam
                className="h-full w-full object-cover"
                forceScreenshotSourceSize
                screenshotQuality={1}
                audio={false}
                screenshotFormat="image/jpeg"
                ref={webRef}
                videoConstraints={videoConstraints as MediaTrackConstraints}
              />

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center mb-4 h-20">
                <div className="flex items-center justify-between gap-8">
                  {isLaptopScreen ? (
                    <DropdownMenu
                      open={showCameraSelector}
                      onOpenChange={setShowCameraSelector}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          className="rounded-full w-13 h-13"
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full" align="start">
                        <DropdownMenuLabel className="flex items-center gap-2 text-md font-medium">
                          <SwitchCamera className="w-4 h-4" />
                          {t("select_camera")}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="space-y-2 p-3">
                          {videoDevices.map((camera) => (
                            <div
                              key={camera.deviceId}
                              className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
                                selectedDeviceId === camera.deviceId
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200"
                              }`}
                              onClick={() => {
                                setSelectedDeviceId(camera.deviceId);
                                setShowCameraSelector(!showCameraSelector);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <CareIcon icon="l-camera" className="w-4 h-4" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {camera.label}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      selectedDeviceId === camera.deviceId
                                        ? "primary"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {selectedDeviceId === camera.deviceId
                                      ? "Selected"
                                      : camera.kind === "videoinput"
                                        ? "Built-in"
                                        : "External"}
                                  </Badge>
                                  {selectedDeviceId === camera.deviceId && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={handleSwitchCamera}
                      className="rounded-full w-12 h-12"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      captureImage();
                      setPreview?.(true);
                    }}
                    className="bg-white rounded-full w-18 h-18 flex items-center justify-center cursor-pointer [&_svg]:px-0 !p-0"
                  >
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-black flex items-center justify-center"></div>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="rounded-full w-13 h-13"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full relative">
              <img
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
                src={previewImage}
                alt="Camera preview"
              />

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center mb-4 h-20">
                <div className="flex items-center justify-between gap-8">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setPreviewImage(null);
                      onResetCapture();
                      setPreview?.(false);
                    }}
                    data-cy="retake-button"
                    className="rounded-full w-13 h-13"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => {
                      onOpenChange(false);
                      setPreviewImage(null);
                      setPreview?.(false);
                    }}
                    data-cy="capture-submit-button"
                    className="w-18 h-18 rounded-full flex items-center justify-center [&_svg]:size-7"
                  >
                    <Check className="text-white" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="rounded-full w-13 h-13"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
