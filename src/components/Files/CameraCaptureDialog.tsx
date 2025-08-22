import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Check, Loader2, RotateCcw, SwitchCamera, X } from "lucide-react";
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

  const { startStream, stopStream, devices, cameraPermission } = useMediaStream(
    {
      constraints: {
        video: videoConstraints,
      },
    },
  );

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="[&>button:first-of-type]:hidden h-[100vh] w-full p-0"
      >
        <div className="relative h-full">
          {!previewImage ? (
            <div className="h-full">
              {cameraPermission === "loading" && <CameraPermissionRequesting />}
              {cameraPermission === "denied" && <CameraPermissionDenied />}
              {cameraPermission === "accepted" && (
                <Webcam
                  className="h-full w-full object-cover"
                  forceScreenshotSourceSize
                  screenshotQuality={1}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  ref={webRef}
                  videoConstraints={videoConstraints as MediaTrackConstraints}
                />
              )}

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center mb-4 h-20">
                <div className="flex items-center justify-between gap-8">
                  {isLaptopScreen ? (
                    videoDevices.length > 1 ? (
                      <DropdownMenu
                        open={showCameraSelector}
                        onOpenChange={setShowCameraSelector}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            className="rounded-full size-13"
                          >
                            <SwitchCamera className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full" align="start">
                          <DropdownMenuLabel className="flex items-center gap-2 text-md font-medium">
                            <SwitchCamera className="size-4" />
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
                                  <CareIcon
                                    icon="l-camera"
                                    className="size-4"
                                  />
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
                                        ? t("selected")
                                        : camera.kind === "videoinput"
                                          ? t("built_in")
                                          : t("external")}
                                    </Badge>
                                    {selectedDeviceId === camera.deviceId && (
                                      <div className="size-2 bg-green-500 rounded-full" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={handleSwitchCamera}
                      className="rounded-full size-12"
                    >
                      <SwitchCamera className="size-4" />
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => {
                      captureImage();
                      setPreview?.(true);
                    }}
                    className="bg-white rounded-full size-18 flex items-center justify-center cursor-pointer [&_svg]:px-0 !p-0"
                  >
                    <div className="size-16 rounded-full bg-white border-2 border-black flex items-center justify-center"></div>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="rounded-full size-13"
                  >
                    <X className="size-5" />
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
                    className="rounded-full size-13"
                  >
                    <RotateCcw className="size-6" />
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => {
                      onOpenChange(false);
                      setPreviewImage(null);
                      setPreview?.(false);
                    }}
                    data-cy="capture-submit-button"
                    className="size-18 rounded-full flex items-center justify-center [&_svg]:size-7"
                  >
                    <Check className="text-white" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="rounded-full size-13"
                  >
                    <X className="size-5" />
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

const CameraPermissionRequesting = () => {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="text-primary-500">
        <Loader2 className="size-10 animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-semibold">
          {t("requesting_camera_access")}
        </span>
        <span className="text-sm text-gray-500">
          {t("allow_camera_access")}
        </span>
      </div>
    </div>
  );
};

const CameraPermissionDenied = () => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 flex flex-row items-center p-6 gap-4 mx-4">
        <div>
          <img
            src="/images/camera_block.svg"
            alt="Camera blocked"
            className="w-60 object-contain"
          />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {t("camera_permission_denied")}
          </h2>

          <ol className="space-y-4 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              {t("click_the_settings_icon_in_browser_address_bar")}
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <span>{t("clear_blocked_camera_permissions")}</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
