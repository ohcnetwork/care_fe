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

  const [cameraFacingFront, setCameraFacingFront] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const webRef = useRef<any>(null);

  const videoConstraints = {
    width: { ideal: 4096 },
    height: { ideal: 2160 },
    facingMode: "user",
  };
  useEffect(() => {
    if (!show) return;
    navigator.mediaDevices.getUserMedia({ video: true }).catch(() => {
      Notify.Warn({
        msg: t("camera_permission_denied"),
      });
      onHide();
    });
  }, [show]);
  const handleSwitchCamera = useCallback(() => {
    const supportedConstraints =
      navigator.mediaDevices.getSupportedConstraints();
    if (
      !isLaptopScreen &&
      typeof supportedConstraints.facingMode === "string" &&
      (supportedConstraints.facingMode as string).includes("environment")
    ) {
      setCameraFacingFront((prevState) => !prevState);
    } else {
      Notify.Warn({
        msg: t("switch_camera_is_not_available"),
      });
    }
  }, []);

  const { width } = useWindowDimensions();
  const LaptopScreenBreakpoint = 640;
  const isLaptopScreen = width >= LaptopScreenBreakpoint ? true : false;

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

  const cameraFacingMode = cameraFacingFront
    ? "user"
    : { exact: "environment" };

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
