import DOMPurify from "dompurify";
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import useDragAndDrop from "@/hooks/useDragAndDrop";

import { useImageCapture } from "@/Utils/imageUtils";
import { useMediaDevicePermission } from "@/Utils/useMediaDevicePermission";

import ImageCropper from "./ImageCropper";

interface Props {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string;
  handleUpload: (
    file: File,
    onSuccess: () => void,
    onError: () => void,
  ) => Promise<void>;
  handleDelete: (onSuccess: () => void, onError: () => void) => Promise<void>;
  hint?: React.ReactNode;
}

const VideoConstraints = {
  user: {
    width: 720,
    height: 720,
    facingMode: "user",
  },
  environment: {
    width: 720,
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
  onOpenChange,
  imageUrl,
  handleUpload,
  handleDelete,
  hint,
}: Props) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const webRef = useRef<Webcam>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCaptureImgBeingUploaded, setIsCaptureImgBeingUploaded] =
    useState(false);
  const [constraint, setConstraint] = useState<IVideoConstraint>(
    VideoConstraints.user,
  );
  const { t } = useTranslation();
  const { captureWebcamImage, processCroppedImage } = useImageCapture();
  const [isDragging, setIsDragging] = useState(false);
  const { requestPermission } = useMediaDevicePermission();
  const [isCropping, setIsCropping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSwitchCamera = useCallback(() => {
    setConstraint(
      constraint.facingMode === "user"
        ? VideoConstraints.environment
        : VideoConstraints.user,
    );
  }, [constraint]);

  const captureImage = async () => {
    const { screenshot, file, error } = await captureWebcamImage(webRef);

    if (error) {
      return;
    }

    if (screenshot && file) {
      setPreviewImage(screenshot);
      setSelectedFile(file);
      // Enter cropping mode when capturing a new image
      setIsCropping(true);
    }
  };

  const handleCroppedImageComplete = useCallback(
    async (croppedImage: string) => {
      setIsProcessing(true);

      try {
        const { file, error } = await processCroppedImage(croppedImage);

        if (error) {
          setErrorMessage(error);
          return;
        }

        if (file) {
          setSelectedFile(file);
          setPreview(croppedImage);
          setIsCropping(false);
          setIsCaptureImgBeingUploaded(false);
          setIsProcessing(false);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Error processing cropped image:", error);
        setErrorMessage(t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"));
      } finally {
        setIsProcessing(false);
      }
    },
    [processCroppedImage, t],
  );

  const closeModal = () => {
    setPreview(undefined);
    setIsProcessing(false);
    setSelectedFile(undefined);
    setPreviewImage(null);
    setIsCaptureImgBeingUploaded(false);
    setIsCropping(false);
    setErrorMessage(null);
    onOpenChange(false);
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
    const file = e.target.files[0];
    if (!isImageFile(file)) {
      toast.warning(t("please_upload_an_image_file"));
      return;
    }
    setSelectedFile(e.target.files[0]);
    setIsCropping(true);
  };

  const uploadAvatar = async () => {
    try {
      if (!selectedFile) {
        closeModal();
        return;
      }

      // Check if file size is greater than 2MB (2 * 1024 * 1024 bytes)
      if (selectedFile.size > 2 * 1024 * 1024) {
        setErrorMessage(t("file_too_large", { maxSize: "2MB" }));
        setIsProcessing(false);
        setIsCaptureImgBeingUploaded(false);
        return;
      }

      // Check if file size is less than 1KB (1024 bytes)
      if (selectedFile.size < 1024) {
        setErrorMessage(t("file_too_small", { minSize: "1KB" }));
        setIsProcessing(false);
        setIsCaptureImgBeingUploaded(false);
        return;
      }

      // Create an image object to verify dimensions
      const img = new Image();
      img.onload = async () => {
        URL.revokeObjectURL(img.src); // Clean up

        // Check image dimensions
        if (img.width < 400 || img.height < 400) {
          setErrorMessage(t("image_too_small", { minDimension: "400x400" }));
          setIsProcessing(false);
          setIsCaptureImgBeingUploaded(false);
          return;
        }

        if (img.width > 1024 || img.height > 1024) {
          setErrorMessage(t("image_too_large", { maxDimension: "1024x1024" }));
          setIsProcessing(false);
          setIsCaptureImgBeingUploaded(false);
          return;
        }

        // If all validations pass, proceed with upload
        setErrorMessage(null);

        try {
          await handleUpload(
            selectedFile,
            () => {
              // Success callback - clear all states and close modal
              setPreview(undefined);
              setIsCaptureImgBeingUploaded(false);
              setIsProcessing(false);
              setSelectedFile(undefined);

              // Close modal on success after a small delay to show the success state
              setTimeout(() => {
                closeModal();
              }, 500);
            },
            () => {
              // Error callback
              setPreview(undefined);
              setPreviewImage(null);
              setIsCaptureImgBeingUploaded(false);
              setIsProcessing(false);
              setErrorMessage(t("upload_failed_try_cropping"));
            },
          );
        } catch (error) {
          console.error("Avatar upload error:", error);
          setErrorMessage(t("AVATAR_EDIT__UPLOAD_ERROR"));
          setIsCaptureImgBeingUploaded(false);
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setErrorMessage(t("AVATAR_EDIT__INVALID_IMAGE"));
        setIsProcessing(false);
        setIsCaptureImgBeingUploaded(false);
      };

      // Create object URL from the selected file
      img.src = DOMPurify.sanitize(URL.createObjectURL(selectedFile));
    } catch (error) {
      console.error("Avatar upload preparation error:", error);
      setErrorMessage(t("AVATAR_EDIT__UPLOAD_ERROR"));
      setIsProcessing(false);
      setIsCaptureImgBeingUploaded(false);
    }
  };

  const deleteAvatar = async () => {
    setIsProcessing(true);
    await handleDelete(
      () => {
        setIsProcessing(false);
        setPreview(undefined);
        setPreviewImage(null);
      },
      () => setIsProcessing(false),
    );
  };

  const dragProps = useDragAndDrop();
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.setDragOver(false);
    setIsDragging(false);
    const droppedFile = e?.dataTransfer?.files[0];
    if (!isImageFile(droppedFile))
      return dragProps.setFileDropError(
        t("AVATAR_EDIT__PLEASE_DROP_IMAGE_FILE"),
      );
    setSelectedFile(droppedFile);
    setIsCropping(true);
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

  const defaultHint = (
    <>
      {t("max_size_for_image_uploaded_should_be", { maxSize: "1MB" })}
      <span className="block my-1"></span>
      {t("allowed_formats_are", { formats: "jpg, png, jpeg" })}{" "}
      {t("recommended_aspect_ratio_for", { aspectRatio: "1:1" })}
    </>
  );

  const hintMessage = hint || defaultHint;

  // Clean up effect to handle unmounting
  useEffect(() => {
    return () => {
      // Reset loading states when component unmounts
      setIsProcessing(false);
      setIsCaptureImgBeingUploaded(false);
    };
  }, []);

  // Reset loading states when dialog is closed
  useEffect(() => {
    if (!open) {
      setIsProcessing(false);
      setIsCaptureImgBeingUploaded(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent className="md:max-w-4xl max-h-screen overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("edit_avatar")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex h-full w-full items-center justify-center overflow-y-auto">
          <div className="flex max-h-screen min-h-96 w-full flex-col overflow-auto">
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                <p className="flex items-center">
                  <CareIcon icon="l-exclamation-circle" className="mr-2" />
                  {errorMessage}
                </p>
              </div>
            )}
            {!isCameraOpen ? (
              <>
                {preview || imageUrl ? (
                  <>
                    <div className="flex flex-1 items-center justify-center rounded-lg relative">
                      <div className="w-full overflow-hidden max-w-full max-h-[calc(100vh-200px)]">
                        {isCropping ? (
                          <ImageCropper
                            imageSrc={preview || imageUrl || ""}
                            onCropComplete={handleCroppedImageComplete}
                            onCancel={() => setIsCropping(false)}
                            isProcessing={isProcessing}
                          />
                        ) : (
                          <img
                            src={DOMPurify.sanitize(preview || imageUrl || "")}
                            alt={t("preview")}
                            className="h-auto w-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                    <p className="text-center font-medium text-secondary-700 text-xs sm:text-sm">
                      {hintMessage}
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
                      className={`size-12 stroke-[2px] ${
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
                        : t("drag_drop_image_to_upload")}
                    </p>
                    <p className="mt-4 text-center font-medium text-secondary-700 text-xs sm:text-sm">
                      {t("no_image_found")}. {hintMessage}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                  <div>
                    <Button
                      id="upload-cover-image"
                      variant="primary"
                      className="w-full"
                      asChild
                    >
                      <label className="cursor-pointer">
                        <CareIcon
                          icon="l-cloud-upload"
                          className="text-lg mr-1"
                        />
                        {t("upload_an_image")}
                        <input
                          title={t("change_file")}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onSelectFile}
                        />
                      </label>
                    </Button>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setConstraint(() => VideoConstraints.user);
                      setIsCameraOpen(true);
                    }}
                  >
                    {t("open_camera")}
                  </Button>
                  {!isCropping && preview && (
                    <Button
                      variant="primary"
                      onClick={() => setIsCropping(true)}
                    >
                      {t("crop")}
                    </Button>
                  )}
                  <div className="sm:flex-1" />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeModal();
                      dragProps.setFileDropError("");
                    }}
                    disabled={isProcessing}
                  >
                    {t("cancel")}
                  </Button>
                  {imageUrl && (
                    <Button
                      variant="destructive"
                      onClick={deleteAvatar}
                      disabled={isProcessing}
                      data-cy="delete-avatar"
                    >
                      {t("delete")}
                    </Button>
                  )}
                  <Button
                    id="save-cover-image"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProcessing(false);
                      setIsCaptureImgBeingUploaded(true);
                      setTimeout(() => {
                        uploadAvatar();
                      }, 10);
                    }}
                    disabled={isCaptureImgBeingUploaded || !selectedFile}
                    data-cy="save-cover-image"
                  >
                    {isCaptureImgBeingUploaded ? (
                      <CareIcon
                        icon="l-spinner"
                        className="animate-spin text-lg mr-1"
                      />
                    ) : (
                      <CareIcon icon="l-save" className="text-lg" />
                    )}
                    <span>
                      {isCaptureImgBeingUploaded
                        ? t("uploading") + "..."
                        : t("save")}
                    </span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-1 items-center justify-center">
                  {!previewImage ? (
                    <>
                      <div className="relative aspect-square max-w-[720px] w-full overflow-hidden">
                        <Webcam
                          audio={false}
                          height={720}
                          width={720}
                          screenshotFormat="image/jpeg"
                          ref={webRef}
                          videoConstraints={constraint}
                          className="h-full w-full object-cover"
                          onUserMediaError={async () => {
                            const requestValue =
                              await requestPermission("user");
                            if (!requestValue.hasPermission) {
                              setIsCameraOpen(false);
                            }
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {isCropping ? (
                        <ImageCropper
                          imageSrc={previewImage}
                          onCropComplete={handleCroppedImageComplete}
                          onCancel={() => setIsCropping(false)}
                          isProcessing={isProcessing}
                        />
                      ) : (
                        <div className="aspect-square max-w-[720px] w-full overflow-hidden">
                          <img
                            src={DOMPurify.sanitize(previewImage || "")}
                            className="h-full w-full object-cover"
                            alt={t("preview")}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* buttons for mobile screens */}
                <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                  {!previewImage ? (
                    <>
                      <Button variant="primary" onClick={handleSwitchCamera}>
                        <CareIcon icon="l-camera-change" className="text-lg" />
                        {t("switch_camera")}
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          captureImage();
                        }}
                      >
                        <CareIcon icon="l-capture" className="text-lg" />
                        {t("capture")}
                      </Button>
                    </>
                  ) : (
                    <>
                      {isCropping ? null : ( // Buttons now handled inside the ImageCropper component
                        <>
                          <Button
                            variant="primary"
                            onClick={() => {
                              setPreviewImage(null);
                            }}
                          >
                            {t("retake")}
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => setIsCropping(true)}
                          >
                            {t("crop")}
                          </Button>
                          <Button
                            variant="primary"
                            disabled={isCaptureImgBeingUploaded}
                            onClick={(_e) => {
                              setIsProcessing(false);
                              setIsCaptureImgBeingUploaded(true);
                              setTimeout(() => {
                                uploadAvatar();
                              }, 10);
                            }}
                          >
                            {isCaptureImgBeingUploaded ? (
                              <>
                                <CareIcon
                                  icon="l-spinner"
                                  className="animate-spin text-lg mr-1"
                                />
                                {t("submitting") + "..."}
                              </>
                            ) : (
                              <>{t("submit")}</>
                            )}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <div className="sm:flex-1"></div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPreviewImage(null);
                      setIsCameraOpen(false);
                      setIsCropping(false);
                      if (webRef.current?.stream) {
                        const tracks = webRef.current.stream.getTracks();
                        tracks.forEach((track) => track.stop());
                      }
                    }}
                    disabled={isProcessing}
                  >
                    {t("close")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarEditModal;
