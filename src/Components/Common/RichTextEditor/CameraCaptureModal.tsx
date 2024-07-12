import Webcam from "react-webcam";
import useWindowDimensions from "../../../Common/hooks/useWindowDimensions";
import DialogModal from "../Dialog";
import { useRef, useState, useCallback } from "react";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import ButtonV2, { Submit } from "../components/ButtonV2";

const CameraCaptureModal = ({
  open,
  onClose,
  setFile,
}: {
  open: boolean;
  onClose: () => void;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const webRef = useRef<Webcam>(null);
  const FACING_MODE_USER = "user";
  const FACING_MODE_ENVIRONMENT = { exact: "environment" };
  const { width } = useWindowDimensions();
  const LaptopScreenBreakpoint = 640;
  const [capture, setCapture] = useState<File | null>(null);

  const isLaptopScreen = width >= LaptopScreenBreakpoint ? true : false;

  const [facingMode, setFacingMode] = useState<"front" | "rear">("front");
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode:
      facingMode === "front" ? FACING_MODE_USER : FACING_MODE_ENVIRONMENT,
  };

  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "front" ? "rear" : "front"));
  }, []);

  const captureImage = () => {
    if (!webRef.current) return;
    setPreviewImage(webRef.current.getScreenshot());
    const canvas = webRef.current.getCanvas();
    canvas?.toBlob((blob: Blob | null) => {
      if (!blob) return;
      const extension = blob.type.split("/").pop();
      const myFile = new File([blob], `image.${extension}`, {
        type: blob.type,
      });
      setCapture(myFile);
    });
  };

  const onUpload = () => {
    setFile(capture);
    onClose();
  };

  return (
    <DialogModal
      show={open}
      title={
        <div className="flex flex-row">
          <div className="rounded-full bg-primary-100 px-5 py-4">
            <CareIcon
              icon="l-camera-change"
              className="text-lg text-primary-500"
            />
          </div>
          <div className="m-4">
            <h1 className="text-xl text-black "> Camera</h1>
          </div>
        </div>
      }
      className="max-w-2xl"
      onClose={onClose}
    >
      <div>
        {!previewImage ? (
          <div className="m-3">
            <Webcam
              forceScreenshotSourceSize
              screenshotQuality={1}
              audio={false}
              screenshotFormat="image/png"
              ref={webRef}
              videoConstraints={videoConstraints}
            />
          </div>
        ) : (
          <div className="m-3">
            <img src={previewImage} />
          </div>
        )}
      </div>

      {/* buttons for mobile screens */}
      <div className="m-4 flex justify-evenly sm:hidden ">
        <div>
          {!previewImage ? (
            <ButtonV2 onClick={handleSwitchCamera} className="m-2">
              switch
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
                  capture
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
                  retake
                </ButtonV2>
                <Submit onClick={onUpload} className="m-2">
                  submit
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
              onClose();
            }}
            className="m-2"
          >
            close
          </ButtonV2>
        </div>
      </div>
      {/* buttons for laptop screens */}
      <div className={`${isLaptopScreen ? " " : " hidden "}`}>
        <div className="m-4 flex lg:hidden">
          <ButtonV2 onClick={handleSwitchCamera}>
            <CareIcon icon="l-camera-change" className="text-lg" />
            switch camera
          </ButtonV2>
        </div>

        <div className="flex justify-end  gap-2 p-4">
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
                    capture
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
                    retake
                  </ButtonV2>
                  <Submit onClick={onUpload}>submit</Submit>
                </div>
              </>
            )}
          </div>
          <div className="sm:flex-1" />
          <ButtonV2
            variant="secondary"
            onClick={() => {
              setPreviewImage(null);
              onClose();
            }}
          >
            close camera
          </ButtonV2>
        </div>
      </div>
    </DialogModal>
  );
};

export default CameraCaptureModal;
