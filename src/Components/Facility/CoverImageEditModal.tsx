import {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Success } from "../../Utils/Notifications";
import useDragAndDrop from "../../Utils/useDragAndDrop";
import { sleep } from "../../Utils/utils";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import Webcam from "react-webcam";
import { FacilityModel } from "./models";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";
import CareIcon from "../../CAREUI/icons/CareIcon";
import * as Notification from "../../Utils/Notifications.js";
import { useTranslation } from "react-i18next";
import { LocalStorageKeys } from "../../Common/constants";
import DialogModal from "../Common/Dialog";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import uploadFile from "../../Utils/request/uploadFile";
import careConfig from "@careConfig";

interface Props {
  open: boolean;
  onClose: (() => void) | undefined;
  onSave?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  facility: FacilityModel;
}

const VideoConstraints = {
  user: {
    width: 1280,
    height: 720,
    facingMode: "user",
  },
  environment: {
    width: 1280,
    height: 720,
    facingMode: { exact: "environment" },
  },
} as const;

type IVideoConstraint =
  (typeof VideoConstraints)[keyof typeof VideoConstraints];

const CoverImageEditModal = ({
  open,
  onClose,
  onSave,
  onDelete,
  facility,
}: Props) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const webRef = useRef<any>(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isCaptureImgBeingUploaded, setIsCaptureImgBeingUploaded] =
    useState(false);
  const [constraint, setConstraint] = useState<IVideoConstraint>(
    VideoConstraints.user,
  );
  const { width } = useWindowDimensions();
  const LaptopScreenBreakpoint = 640;
  const isLaptopScreen = width >= LaptopScreenBreakpoint;
  const { t } = useTranslation();
  const handleSwitchCamera = useCallback(() => {
    setConstraint((prev) =>
      prev.facingMode === "user"
        ? VideoConstraints.environment
        : VideoConstraints.user,
    );
  }, []);

  const captureImage = () => {
    setPreviewImage(webRef.current.getScreenshot());
    const canvas = webRef.current.getCanvas();
    canvas?.toBlob((blob: Blob) => {
      const myFile = new File([blob], "image.png", {
        type: blob.type,
      });
      setSelectedFile(myFile);
    });
  };
  const closeModal = () => {
    setPreview(undefined);
    setSelectedFile(undefined);
    onClose?.();
  };

  const maxWidth = 1024;
  const maxHeight = 1024;

  useEffect(() => {
    if (selectedFile) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(selectedFile);
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        if (width > maxWidth || height > maxHeight) {
          Notification.Error({
            msg: `Image dimensions (${width}x${height}) exceed allowed size of ${maxWidth}x${maxHeight} pixels.`,
          });
        } else {
          setPreview(objectUrl);
        }
      };

      img.src = objectUrl;

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [selectedFile]);

  const onSelectFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    setIsCaptureImgBeingUploaded(true);
    if (!selectedFile) {
      setIsCaptureImgBeingUploaded(false);
      closeModal();
      return;
    }

    const formData = new FormData();
    formData.append("cover_image", selectedFile);
    const url = `${careConfig.apiUrl}/api/v1/facility/${facility.id}/cover_image/`;
    setIsProcessing(true);

    uploadFile(
      url,
      formData,
      "POST",
      {
        Authorization:
          "Bearer " + localStorage.getItem(LocalStorageKeys.accessToken),
      },
      async (xhr: XMLHttpRequest) => {
        if (xhr.status === 200) {
          Success({ msg: "Cover image updated." });
          setIsProcessing(false);
          setIsCaptureImgBeingUploaded(false);
          await sleep(1000);
          onSave?.();
          closeModal();
        } else {
          Notification.Error({
            msg: "Something went wrong!",
          });
          setIsProcessing(false);
        }
      },
      null,
      () => {
        Notification.Error({
          msg: "Network Failure. Please check your internet connectivity.",
        });
        setIsProcessing(false);
      },
    );
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    const { res } = await request(routes.deleteFacilityCoverImage, {
      pathParams: { id: facility.id! },
    });
    if (res?.ok) {
      Success({ msg: "Cover image deleted" });
    }
    setIsProcessing(false);
    onDelete?.();
    closeModal();
  };

  const hasImage = !!(preview || facility.read_cover_image_url);
  const imgSrc =
    preview || `${facility.read_cover_image_url}?requested_on=${Date.now()}`;

  const dragProps = useDragAndDrop();
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.setDragOver(false);
    const dropedFile = e?.dataTransfer?.files[0];
    if (dropedFile.type.split("/")[0] !== "image")
      return dragProps.setFileDropError("Please drop an image file to upload!");
    setSelectedFile(dropedFile);
  };
  const commonHint = (
    <>
      {t("max_size_for_image_uploaded_should_be")} 1mb.
      <br />
      {t("allowed_formats_are")} jpg,png,jpeg.
      {t("recommended_aspect_ratio_for")} facility cover photo is 1:1
    </>
  );

  return (
    <DialogModal
      show={open}
      onClose={closeModal}
      title={t("edit_cover_photo")}
      description={facility.name}
      className="md:max-w-4xl"
    >
      <div className="flex h-full w-full items-center justify-center overflow-y-auto">
        {!isCameraOpen ? (
          <form className="flex max-h-screen min-h-96 w-full flex-col overflow-auto">
            {hasImage ? (
              <>
                <div className="flex flex-1 items-center justify-center rounded-lg">
                  <img
                    src={imgSrc}
                    alt={facility.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-center font-medium text-secondary-700">
                  {commonHint}
                </p>
              </>
            ) : (
              <div
                onDragOver={dragProps.onDragOver}
                onDragLeave={dragProps.onDragLeave}
                onDrop={onDrop}
                className={`mt-8 flex flex-1 flex-col items-center justify-center rounded-lg border-[3px] border-dashed px-3 py-6 ${
                  dragProps.dragOver && "border-primary-500"
                } ${
                  dragProps.fileDropError !== ""
                    ? "border-red-500"
                    : "border-secondary-500"
                }`}
              >
                <svg
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  className={`h-12 w-12 stroke-[2px] ${
                    dragProps.dragOver && "text-primary-500"
                  } ${
                    dragProps.fileDropError !== ""
                      ? "text-red-500"
                      : "text-secondary-600"
                  }`}
                >
                  <path d="M28 8H12a4 4 0 0 0-4 4v20m32-12v8m0 0v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-4m32-4-3.172-3.172a4 4 0 0 0-5.656 0L28 28M8 32l9.172-9.172a4 4 0 0 1 5.656 0L28 28m0 0 4 4m4-24h8m-4-4v8m-12 4h.02" />
                </svg>
                <p
                  className={`text-sm ${
                    dragProps.dragOver && "text-primary-500"
                  } ${
                    dragProps.fileDropError !== ""
                      ? "text-red-500"
                      : "text-secondary-700"
                  } text-center`}
                >
                  {dragProps.fileDropError !== ""
                    ? dragProps.fileDropError
                    : `${t("drag_drop_image_to_upload")}`}
                </p>
                <p className="mt-4 text-center font-medium text-secondary-700">
                  {t("no_cover_photo_uploaded_for_this_facility")}. {commonHint}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4 sm:flex-row">
              <div>
                <label
                  id="upload-cover-image"
                  className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-primary-500 bg-white px-4 py-2 text-sm font-medium text-primary-500 transition-all hover:border-primary-400 hover:text-primary-400"
                >
                  <CareIcon icon="l-cloud-upload" className="text-lg" />
                  {t("upload_an_image")}
                  <input
                    title="changeFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onSelectFile}
                  />
                </label>
              </div>
              <div className="sm:flex-1" />
              <ButtonV2
                onClick={() => {
                  setIsCameraOpen(true);
                }}
              >
                {`${t("open")} ${t("camera")}`}
              </ButtonV2>
              <Cancel
                onClick={(e) => {
                  e.stopPropagation();
                  closeModal();
                  dragProps.setFileDropError("");
                }}
                disabled={isProcessing}
              />
              {facility.read_cover_image_url && (
                <ButtonV2
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  {t("delete")}
                </ButtonV2>
              )}
              <ButtonV2
                id="save-cover-image"
                onClick={handleUpload}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <CareIcon icon="l-spinner" className="animate-spin text-lg" />
                ) : (
                  <CareIcon icon="l-save" className="text-lg" />
                )}
                <span>
                  {isProcessing ? `${t("uploading")}...` : `${t("save")}`}
                </span>
              </ButtonV2>
            </div>
          </form>
        ) : (
          <div className="flex max-h-screen min-h-96 flex-col overflow-auto">
            <div className="mb-1 mt-2 flex flex-col">
              <span className="text-xl font-medium">
                {t("capture_cover_photo")}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              {!previewImage ? (
                <>
                  <Webcam
                    audio={false}
                    height={720}
                    screenshotFormat="image/jpeg"
                    width={1280}
                    ref={webRef}
                    videoConstraints={constraint}
                  />
                </>
              ) : (
                <>
                  <img src={previewImage} />
                </>
              )}
            </div>
            {/* buttons for mobile screens */}
            <div className="m-4 flex flex-col justify-evenly sm:hidden">
              <div>
                {!previewImage ? (
                  <ButtonV2
                    onClick={handleSwitchCamera}
                    className="my-2 w-full"
                  >
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
                        className="my-2 w-full"
                      >
                        {t("capture")}
                      </ButtonV2>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <ButtonV2
                        onClick={() => {
                          setPreviewImage(null);
                        }}
                        className="my-2 w-full"
                        disabled={isProcessing}
                      >
                        {t("retake")}
                      </ButtonV2>
                      <ButtonV2 onClick={handleUpload} className="my-2 w-full">
                        {isCaptureImgBeingUploaded && (
                          <CareIcon
                            icon="l-spinner"
                            className="animate-spin text-lg"
                          />
                        )}
                        {t("submit")}
                      </ButtonV2>
                    </div>
                  </>
                )}
              </div>
              <div className="sm:flex-1">
                <ButtonV2
                  variant="secondary"
                  onClick={() => {
                    setPreviewImage(null);
                    setIsCameraOpen(false);
                    webRef.current.stopCamera();
                  }}
                  className="my-2 w-full"
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
                        <Submit disabled={isProcessing} onClick={handleUpload}>
                          {isCaptureImgBeingUploaded ? (
                            <>
                              <CareIcon
                                icon="l-spinner"
                                className="animate-spin text-lg"
                              />
                              {`${t("submitting")}...`}
                            </>
                          ) : (
                            <> {t("submit")}</>
                          )}
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
                    setIsCameraOpen(false);
                    webRef.current.stopCamera();
                  }}
                >
                  {`${t("close")} ${t("camera")}`}
                </ButtonV2>
              </div>
            </div>
          </div>
        )}
      </div>
    </DialogModal>
  );
};

export default CoverImageEditModal;
