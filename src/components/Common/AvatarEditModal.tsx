import careConfig from "@careConfig";
import DOMPurify from "dompurify";
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import Webcam from "react-webcam";
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

import useDragAndDrop from "@/hooks/useDragAndDrop";

import { useMediaDevicePermission } from "@/Utils/useMediaDevicePermission";

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
  aspectRatio: keyof typeof ASPECT_RATIOS;
}

const VideoConstraints = {
  user: {
    width: {
      min: 400,
      max: 1024,
    },
    height: {
      min: 400,
      max: 1024,
    },
    facingMode: "user",
  },
  environment: {
    width: {
      min: 400,
      max: 1024,
    },
    height: {
      min: 400,
      max: 1024,
    },
    facingMode: "environment",
  },
} as const;

const ASPECT_RATIOS = {
  "1:1": 1,
  "16:9": 16 / 9,
} as const;

const MAX_FILE_SIZE = careConfig.imageUploadMaxSizeInMB * 1024 * 1024; // 2MB
const MIN_DIMENSION = 400;
const MAX_DIMENSION = 1024;

const isImageFile = (file?: File) => file?.type.split("/")[0] === "image";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  aspectRatio: number,
): Promise<File> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Calculate output dimensions based on aspect ratio and constraints
  let outputWidth: number;
  let outputHeight: number;

  if (aspectRatio === 1) {
    // For 1:1, use the smaller dimension but ensure it's within bounds
    const size = Math.min(pixelCrop.width, pixelCrop.height);
    outputWidth = outputHeight = Math.max(
      MIN_DIMENSION,
      Math.min(MAX_DIMENSION, size),
    );
  } else {
    // For 16:9, calculate based on the crop area
    if (pixelCrop.width / pixelCrop.height > aspectRatio) {
      // Width is the limiting factor
      outputHeight = Math.max(
        MIN_DIMENSION,
        Math.min(MAX_DIMENSION, pixelCrop.height),
      );
      outputWidth = Math.min(MAX_DIMENSION, outputHeight * aspectRatio);
    } else {
      // Height is the limiting factor
      outputWidth = Math.max(
        MIN_DIMENSION,
        Math.min(MAX_DIMENSION, pixelCrop.width),
      );
      outputHeight = Math.min(MAX_DIMENSION, outputWidth / aspectRatio);
    }
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Clear canvas with white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const file = new File([blob], "cropped-image.jpeg", {
          type: "image/jpeg",
        });

        resolve(file);
      },
      "image/jpeg",
      1,
    );
  });
};

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
  aspectRatio = "1:1",
}: Props) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const webRef = useRef<Webcam>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCaptureImgBeingUploaded, setIsCaptureImgBeingUploaded] =
    useState(false);
  const [constraint, setConstraint] = useState<IVideoConstraint>(
    VideoConstraints.user,
  );
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const { requestPermission } = useMediaDevicePermission();

  const handleSwitchCamera = useCallback(() => {
    setConstraint(
      constraint.facingMode === "user"
        ? VideoConstraints.environment
        : VideoConstraints.user,
    );
  }, []);

  const captureImage = () => {
    if (webRef.current) {
      const video = webRef.current.video;
      if (!video) return;

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      const width = Math.min(Math.max(video.videoWidth, 400), 1024);
      const height = Math.min(Math.max(video.videoHeight, 400), 1024);

      canvas.width = width;
      canvas.height = height;

      context.drawImage(video, 0, 0, width, height);

      const imageData = canvas.toDataURL("image/jpeg");
      setPreviewImage(imageData);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const myFile = new File([blob], "image.png", {
              type: blob.type,
            });
            setSelectedFile(myFile);
          } else {
            toast.error(t("failed_to_capture_image"));
          }
        },
        "image/jpeg",
        1.0,
      );
    }
  };

  const stopCamera = useCallback(() => {
    try {
      if (webRef.current) {
        const openCamera = webRef.current?.video?.srcObject as MediaStream;
        if (openCamera) {
          openCamera.getTracks().forEach((track) => track.stop());
        }
      }
    } catch {
      toast.error(t("failed_to_stop_camera"));
    } finally {
      setIsCameraOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !isCameraOpen) {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
        setCurrentStream(null);
      }
      if (webRef.current?.stream) {
        const tracks = webRef.current.stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    }
  }, [open, isCameraOpen, currentStream]);

  const closeModal = () => {
    setPreview(undefined);
    setIsProcessing(false);
    setSelectedFile(undefined);
    setIsCameraOpen(false);
    setPreviewImage(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
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
    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        t("image_size_error", { size: careConfig.imageUploadMaxSizeInMB }),
      );
      return;
    }

    setSelectedFile(file);
  };

  const uploadAvatar = async () => {
    try {
      if (!selectedFile) {
        closeModal();
        return;
      }

      setIsProcessing(true);
      setIsCaptureImgBeingUploaded(true);

      let fileToUpload = selectedFile;

      if (croppedAreaPixels && preview) {
        try {
          fileToUpload = await getCroppedImg(
            preview,
            croppedAreaPixels,
            ASPECT_RATIOS[aspectRatio],
          );
        } catch {
          toast.error(t("failed_to_crop_image_using_original_image"));
          // Fall back to original file if cropping fails
          fileToUpload = selectedFile;
        }
      }

      await handleUpload(
        fileToUpload,
        () => {
          setPreview(undefined);
          closeModal();
        },
        () => {
          setPreview(undefined);
          setPreviewImage(null);
          setIsCaptureImgBeingUploaded(false);
          setIsProcessing(false);
        },
      );
    } finally {
      setIsCaptureImgBeingUploaded(false);
      setIsProcessing(false);
      setPreview(undefined);
    }
  };

  const deleteAvatar = async () => {
    setIsProcessing(true);
    await handleDelete(
      () => {
        setIsProcessing(false);
        setPreview(undefined);
        setPreviewImage(null);
        closeModal();
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
      return dragProps.setFileDropError(t("drop_an_image_error"));
    if (droppedFile.size > MAX_FILE_SIZE) {
      dragProps.setFileDropError(
        t("image_size_error", { size: careConfig.imageUploadMaxSizeInMB }),
      );
      return;
    }

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
    <Dialog open={open} onOpenChange={closeModal}>
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
                    <div className="relative w-full h-[400px]">
                      <Cropper
                        image={
                          preview && preview.startsWith("blob:")
                            ? DOMPurify.sanitize(preview)
                            : imageUrl
                        }
                        crop={crop}
                        zoom={zoom}
                        aspect={ASPECT_RATIOS[aspectRatio]}
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
                        cropShape={aspectRatio === "1:1" ? "rect" : "rect"}
                      />
                    </div>

                    <p className="text-center font-medium text-secondary-700 mt-2">
                      {hintMessage}
                    </p>
                  </>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="saved-photo"
                    className={cn(
                      "w-full max-w-[400px] max-h-[400px] mx-auto object-cover",
                      aspectRatio === "1:1" ? "aspect-square" : "aspect-video",
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
                        />
                      </label>
                    </Button>
                  </div>
                  <Button
                    variant="primary"
                    onClick={async () => {
                      setConstraint(() => VideoConstraints.user);
                      const result = await requestPermission("user");
                      if (result.hasPermission && result.mediaStream) {
                        setCurrentStream(result.mediaStream);
                        setIsCameraOpen(true);
                      }
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
                    onClick={uploadAvatar}
                    disabled={isProcessing || !selectedFile}
                    data-cy="save-cover-image"
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
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-1 items-center justify-center">
                  {!previewImage ? (
                    <>
                      <Webcam
                        audio={false}
                        screenshotFormat="image/jpeg"
                        ref={webRef}
                        videoConstraints={{
                          ...constraint,
                          width: {
                            ...constraint.width,
                            ideal: window.innerWidth,
                          },
                          height: {
                            ...constraint.height,
                            ideal: window.innerHeight,
                          },
                        }}
                        onUserMediaError={async () => {
                          const requestValue = await requestPermission("user");
                          if (!requestValue.hasPermission) {
                            setIsCameraOpen(false);
                          }
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Captured preview"
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                  {!previewImage ? (
                    <>
                      <Button variant="primary" onClick={handleSwitchCamera}>
                        <CareIcon icon="l-camera-change" className="text-lg" />
                        {`${t("switch")} ${t("camera")}`}
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
                        disabled={isProcessing}
                        onClick={uploadAvatar}
                      >
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
                      </Button>
                    </>
                  )}
                  <div className="sm:flex-1"></div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPreviewImage(null);
                      setIsCameraOpen(false);
                      stopCamera();
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
