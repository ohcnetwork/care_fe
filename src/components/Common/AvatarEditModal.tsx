import careConfig from "@careConfig";
import DOMPurify from "dompurify";
import { Crop } from "lucide-react";
import { ChangeEventHandler, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import CameraCaptureDialog from "@/components/Files/CameraCaptureDialog";

import useDragAndDrop from "@/hooks/useDragAndDrop";

import { getCroppedImg } from "@/Utils/getCroppedImg";

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
  aspectRatio: number;
}

const MAX_FILE_SIZE = careConfig.imageUploadMaxSizeInMB * 1024 * 1024; // 2MB
const isImageFile = (file?: File) => file?.type.split("/")[0] === "image";

export default function AvatarEditModal({
  title,
  open,
  onOpenChange,
  imageUrl,
  handleUpload,
  handleDelete,
  hint,
  aspectRatio = 1,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [showCroppedPreview, setShowCroppedPreview] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);

  const resetState = () => {
    setPreview(undefined);
    setIsProcessing(false);
    setIsDeleting(false);
    setSelectedFile(undefined);
    setIsCameraOpen(false);
    setCroppedAreaPixels(null);
    setCroppedPreview(null);
    setShowCroppedPreview(false);
    setShowCameraPreview(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const closeModal = () => {
    resetState();
    onOpenChange(false);
  };

  useEffect(() => {
    if (!isImageFile(selectedFile)) {
      return;
    }
    // Only create object URL for file uploads, not camera captures
    if (!showCameraPreview) {
      const objectUrl = URL.createObjectURL(selectedFile!);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile, showCameraPreview]);

  const onSelectFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }
    const file = e.target.files[0];
    if (file.type === "image/gif") {
      toast.error(t("avatar_gif_not_allowed"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        t("image_size_error", { size: careConfig.imageUploadMaxSizeInMB }),
      );
      return;
    }
    setSelectedFile(file);
    setShowCroppedPreview(false);
    setShowCameraPreview(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const cropImage = async () => {
    if (!croppedAreaPixels || !preview) return;

    try {
      setIsProcessing(true);
      const { file, previewUrl } = await getCroppedImg(
        preview,
        croppedAreaPixels,
        aspectRatio,
      );
      setSelectedFile(file);
      setCroppedPreview(previewUrl);
      setShowCroppedPreview(true);
      toast.success(t("image_cropped_successfully"));
    } catch {
      toast.error(t("failed_to_crop_image_using_original_image"));
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadAvatar = async () => {
    try {
      if (!selectedFile) {
        closeModal();
        return;
      }

      setIsProcessing(true);

      await handleUpload(
        selectedFile,
        () => {
          setPreview(undefined);
          closeModal();
        },
        () => {
          setPreview(undefined);
          setIsProcessing(false);
        },
      );
    } finally {
      setIsProcessing(false);
      setPreview(undefined);
    }
  };

  const deleteAvatar = async () => {
    setIsDeleting(true);
    await handleDelete(
      () => {
        setIsDeleting(false);
        setPreview(undefined);
        closeModal();
      },
      () => setIsDeleting(false),
    );
  };

  const dragProps = useDragAndDrop();
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragProps.setDragOver(false);
    setIsDragging(false);
    const droppedFile = e?.dataTransfer?.files[0];
    if (!isImageFile(droppedFile))
      return dragProps.setFileDropError(t("please_upload_an_image_file"));
    if (droppedFile.type === "image/gif") {
      dragProps.setFileDropError(t("avatar_gif_not_allowed"));
      return;
    }
    if (droppedFile.size > MAX_FILE_SIZE) {
      dragProps.setFileDropError(
        t("image_size_error", { size: careConfig.imageUploadMaxSizeInMB }),
      );
      return;
    }

    setSelectedFile(droppedFile);
    setShowCameraPreview(false);
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
      {t("max_size_for_image_uploaded_should_be", {
        maxSize: `${careConfig.imageUploadMaxSizeInMB}MB`,
      })}
      <br />
      {t("allowed_formats_are", { formats: "jpg, png, jpeg" })}{" "}
      {t("recommended_aspect_ratio_for", { aspectRatio: "1:1" })}
    </>
  );

  const hintMessage = hint || defaultHint;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
        else onOpenChange(open);
      }}
    >
      <DialogContent className="md:max-w-4xl max-h-screen overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("edit_avatar")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-full w-full items-center justify-center overflow-y-auto">
          <div className="flex max-h-screen w-full flex-col overflow-auto">
            {!isCameraOpen ? (
              <>
                {preview ? (
                  <>
                    {!showCroppedPreview ? (
                      <>
                        <div className="relative w-full h-[400px]">
                          <Cropper
                            image={
                              preview && preview.startsWith("blob:")
                                ? DOMPurify.sanitize(preview)
                                : preview
                            }
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={setCrop}
                            onCropComplete={(
                              croppedArea: Area,
                              croppedAreaPixels: Area,
                            ) => {
                              setCroppedAreaPixels(croppedAreaPixels);
                            }}
                            onZoomChange={setZoom}
                            minZoom={0.1}
                            maxZoom={3}
                          />
                        </div>
                        <p className="text-center font-medium text-secondary-700 mt-2">
                          {showCameraPreview
                            ? t("adjust_crop_area_for_captured_image")
                            : hintMessage}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                          {croppedPreview ? (
                            <img
                              src={croppedPreview || "/placeholder.svg"}
                              alt="Cropped preview"
                              loading="lazy"
                              decoding="async"
                              className={cn(
                                "max-w-full max-h-full object-contain rounded-lg",
                                aspectRatio === 1
                                  ? "aspect-square"
                                  : aspectRatio === 16 / 9
                                    ? "aspect-video"
                                    : "",
                              )}
                            />
                          ) : (
                            <div className="text-center text-secondary-500">
                              <p className="text-sm">
                                {t("no_preview_available")}
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-center font-medium text-secondary-700 mt-2">
                          {t("preview_cropped_image_hint")}
                        </p>
                      </>
                    )}
                  </>
                ) : imageUrl ? (
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt="saved-photo"
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      "w-full max-w-[400px] max-h-[400px] mx-auto object-cover",
                      aspectRatio === 1
                        ? "aspect-square"
                        : aspectRatio === 16 / 9
                          ? "aspect-video"
                          : "",
                    )}
                  />
                ) : (
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                      "mt-8 flex flex-1 flex-col items-center justify-center rounded-lg border-[3px] border-dashed px-3 py-6",
                      {
                        "border-primary-800 bg-primary-100": isDragging,
                        "border-primary-500": !isDragging && dragProps.dragOver,
                        "border-secondary-500":
                          !isDragging &&
                          !dragProps.dragOver &&
                          !dragProps.fileDropError,
                        "border-red-500": dragProps.fileDropError !== "",
                      },
                    )}
                  >
                    <svg
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                      className={cn("size-12 stroke-[2px]", {
                        "text-green-500": isDragging,
                        "text-primary-500": !isDragging && dragProps.dragOver,
                        "text-secondary-600":
                          !isDragging &&
                          !dragProps.dragOver &&
                          !dragProps.fileDropError,
                        "text-red-500": dragProps.fileDropError !== "",
                      })}
                    >
                      <path d="M28 8H12a4 4 0 0 0-4 4v20m32-12v8m0 0v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-4m32-4-3.172-3.172a4 4 0 0 0-5.656 0L28 28M8 32l9.172-9.172a4 4 0 0 1 5.656 0L28 28m0 0 4 4m4-24h8m-4-4v8m-12 4h.02" />
                    </svg>
                    <p
                      className={cn("text-sm text-center", {
                        "text-primary-500": dragProps.dragOver,
                        "text-red-500": dragProps.fileDropError !== "",
                        "text-secondary-700":
                          !dragProps.dragOver && dragProps.fileDropError === "",
                      })}
                    >
                      {dragProps.fileDropError !== ""
                        ? dragProps.fileDropError
                        : `${t("drag_drop_image_to_upload")}`}
                    </p>
                    <p className="mt-4 text-center font-medium text-secondary-700">
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
                      disabled={isProcessing || isDeleting}
                      asChild
                    >
                      <label className="cursor-pointer">
                        <CareIcon
                          icon="l-cloud-upload"
                          className="text-lg mr-1"
                        />
                        {t("upload_an_image")}
                        <input
                          title="changeFile"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onSelectFile}
                          disabled={isProcessing || isDeleting}
                        />
                      </label>
                    </Button>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsCameraOpen(true);
                    }}
                  >
                    {`${t("open_camera")}`}
                  </Button>
                  <div className="sm:flex-1" />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeModal();
                      dragProps.setFileDropError("");
                    }}
                    disabled={isProcessing || isDeleting}
                  >
                    {t("cancel")}
                  </Button>
                  {imageUrl && !preview && (
                    <Button
                      variant="destructive"
                      onClick={deleteAvatar}
                      disabled={isProcessing || isDeleting}
                    >
                      {isDeleting ? (
                        <CareIcon
                          icon="l-spinner"
                          className="animate-spin text-lg mr-1"
                        />
                      ) : null}
                      {isDeleting ? `${t("deleting")}...` : t("delete")}
                    </Button>
                  )}
                  <Button
                    id="save-cover-image"
                    variant="outline"
                    onClick={showCroppedPreview ? uploadAvatar : cropImage}
                    disabled={
                      (!!imageUrl && !preview) ||
                      isProcessing ||
                      isDeleting ||
                      !selectedFile ||
                      (!croppedAreaPixels && !showCroppedPreview)
                    }
                  >
                    {isProcessing ? (
                      <CareIcon
                        icon="l-spinner"
                        className="animate-spin text-lg"
                      />
                    ) : showCroppedPreview ? (
                      <CareIcon icon="l-cloud-upload" className="text-lg" />
                    ) : (
                      <Crop className="text-lg" />
                    )}
                    <span>
                      {isProcessing
                        ? showCroppedPreview
                          ? t("uploading_indicator")
                          : t("cropping_indicator")
                        : showCroppedPreview
                          ? t("upload")
                          : t("crop")}
                    </span>
                  </Button>
                </div>
              </>
            ) : (
              <CameraCaptureDialog
                open={isCameraOpen}
                onOpenChange={setIsCameraOpen}
                onCapture={(file) => {
                  setSelectedFile(file);
                  setShowCameraPreview(true);
                  setCroppedAreaPixels(null);
                  setCroppedPreview(null);
                  setShowCroppedPreview(false);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                }}
                onResetCapture={() => {
                  setSelectedFile(undefined);
                  setShowCameraPreview(false);
                }}
                setPreview={(isPreview) => {
                  setShowCameraPreview(isPreview);
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
