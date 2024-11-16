import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2, { Cancel, Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";

import useDragAndDrop from "@/hooks/useDragAndDrop";

import { Warn } from "@/Utils/Notifications";

interface Props {
  title: string;
  open: boolean;
  imageUrl?: string;
  handleUpload: (file: File, onError: () => void) => Promise<void>;
  handleDelete: (onError: () => void) => Promise<void>;
  onClose?: () => void;
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

const isImageFile = (file?: File) => file?.type.split("/")[0] === "image";

type IVideoConstraint =
  (typeof VideoConstraints)[keyof typeof VideoConstraints];

const AvatarEditModal = ({
  title,
  open,
  imageUrl,
  handleUpload,
  handleDelete,
  onClose,
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
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);

  const handleSwitchCamera = useCallback(() => {
    setConstraint(
      constraint.facingMode === "user"
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
    setIsProcessing(false);
    setSelectedFile(undefined);
    onClose?.();
  };

  useEffect(() => {
    if (!isImageFile(selectedFile)) {
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile!);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const onSelectFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }
    if (!isImageFile(e.target.files[0])) {
      Warn({ msg: "Please upload an image file!" });
      return;
    }
    setSelectedFile(e.target.files[0]);
  };

  const uploadAvatar = async () => {
    if (!selectedFile) {
      closeModal();
      return;
    }

    setIsProcessing(true);
    setIsCaptureImgBeingUploaded(true);
    await handleUpload(selectedFile, () => {
      setSelectedFile(undefined);
      setPreview(undefined);
      setPreviewImage(null);
      setIsCaptureImgBeingUploaded(false);
      setIsProcessing(false);
    });
  };

  const deleteAvatar = async () => {
    setIsProcessing(true);
    await handleDelete(() => {
      setIsProcessing(false);
    });
  };

  const dragProps = useDragAndDrop();
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.setDragOver(false);
    setIsDragging(false);
    const droppedFile = e?.dataTransfer?.files[0];
    if (!isImageFile(droppedFile))
      return dragProps.setFileDropError("Please drop an image file to upload!");
    setSelectedFile(droppedFile);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.onDragOver(e);
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.onDragLeave();
    setIsDragging(false);
  };

  const commonHint = (
    <>
      {t("max_size_for_image_uploaded_should_be")} 1mb.
      <br />
      {t("allowed_formats_are")} jpg,png,jpeg.{" "}
      {t("recommended_aspect_ratio_for")} the image is 1:1
    </>
  );

  return (
    <DialogModal
      show={open}
      onClose={closeModal}
      title={title}
      className="md:max-w-4xl"
    >
      <div className="flex h-full w-full items-center justify-center overflow-y-auto">
        <div className="flex max-h-screen min-h-96 w-full flex-col overflow-auto">
          {!isCameraOpen ? (
            <>
              {preview || imageUrl ? (
                <>
                  <div className="flex flex-1 items-center justify-center rounded-lg">
                    <img
                      src={preview || imageUrl}
                      alt="cover-photo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-center font-medium text-secondary-700">
                    {commonHint}
                  </p>
                </>
              ) : (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`mt-8 flex flex-1 flex-col items-center justify-center rounded-lg border-[3px] border-dashed px-3 py-6 ${
                    isDragging
                      ? "border-primary-800 bg-primary-100"
                      : dragProps.dragOver
                        ? "border-primary-500"
                        : "border-secondary-500"
                  } ${dragProps.fileDropError !== "" ? "border-red-500" : ""}`}
                >
                  <svg
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                    className={`h-12 w-12 stroke-[2px] ${
                      isDragging
                        ? "text-green-500"
                        : dragProps.dragOver
                          ? "text-primary-500"
                          : "text-secondary-600"
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
                      dragProps.dragOver
                        ? "text-primary-500"
                        : "text-secondary-700"
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
                    {t("no_image_found")}. {commonHint}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                <div>
                  <label
                    id="upload-cover-image"
                    className="button-size-default button-shape-square button-primary-default inline-flex h-min w-full cursor-pointer items-center justify-center gap-2 whitespace-pre font-medium shadow outline-offset-1 transition-all duration-200 ease-in-out enabled:hover:shadow-md disabled:cursor-not-allowed disabled:bg-secondary-200 disabled:text-secondary-500"
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
                <ButtonV2
                  onClick={() => {
                    setConstraint(() => VideoConstraints.user);
                    setIsCameraOpen(true);
                  }}
                >
                  {`${t("open")} ${t("camera")}`}
                </ButtonV2>
                <div className="sm:flex-1" />
                <Cancel
                  onClick={(e) => {
                    e.stopPropagation();
                    closeModal();
                    dragProps.setFileDropError("");
                  }}
                  disabled={isProcessing}
                />
                {imageUrl && (
                  <ButtonV2
                    variant="danger"
                    onClick={deleteAvatar}
                    disabled={isProcessing}
                  >
                    {t("delete")}
                  </ButtonV2>
                )}
                <ButtonV2
                  id="save-cover-image"
                  onClick={uploadAvatar}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <CareIcon
                      icon="l-spinner"
                      className="animate-spin text-lg"
                    />
                  ) : (
                    <CareIcon icon="l-save" className="text-lg" />
                  )}
                  <span>
                    {isProcessing ? `${t("uploading")}...` : `${t("save")}`}
                  </span>
                </ButtonV2>
              </div>
            </>
          ) : (
            <>
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
                      onUserMediaError={(_e) => {
                        setIsCameraOpen(false);
                        Warn({ msg: t("camera_permission_denied") });
                      }}
                    />
                  </>
                ) : (
                  <>
                    <img src={previewImage} />
                  </>
                )}
              </div>
              {/* buttons for mobile screens */}
              <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                {!previewImage ? (
                  <>
                    <ButtonV2 onClick={handleSwitchCamera}>
                      <CareIcon icon="l-camera-change" className="text-lg" />
                      {`${t("switch")} ${t("camera")}`}
                    </ButtonV2>
                    <ButtonV2
                      onClick={() => {
                        captureImage();
                      }}
                    >
                      <CareIcon icon="l-capture" className="text-lg" />
                      {t("capture")}
                    </ButtonV2>
                  </>
                ) : (
                  <>
                    <ButtonV2
                      onClick={() => {
                        setPreviewImage(null);
                      }}
                    >
                      {t("retake")}
                    </ButtonV2>
                    <Submit disabled={isProcessing} onClick={uploadAvatar}>
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
                  </>
                )}
                <div className="sm:flex-1"></div>
                <Cancel
                  onClick={() => {
                    setPreviewImage(null);
                    setIsCameraOpen(false);
                    webRef.current.stopCamera();
                  }}
                  label={t("close")}
                  disabled={isProcessing}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </DialogModal>
  );
};

export default AvatarEditModal;
