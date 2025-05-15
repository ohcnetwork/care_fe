import careConfig from "@careConfig";
import DOMPurify from "dompurify";
import type React from "react";
import {
  type ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
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

// Function to create a centered crop with a 1:1 aspect ratio
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

// Function to get a resized canvas
function getResizedCanvas(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
) {
  let width = canvas.width;
  let height = canvas.height;

  // Only resize if the image is larger than the maximum dimensions
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const resizedCanvas = document.createElement("canvas");

  // Set the canvas dimensions
  resizedCanvas.width = width;
  resizedCanvas.height = height;

  const ctx = resizedCanvas.getContext("2d");

  if (ctx) {
    // Enable high quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw the image at the new size
    ctx.drawImage(canvas, 0, 0, width, height);
  }

  return resizedCanvas;
}

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
  const [constraint, setConstraint] = useState<IVideoConstraint>(
    VideoConstraints.user,
  );
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const { requestPermission } = useMediaDevicePermission();

  // Crop related states
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleSwitchCamera = useCallback(() => {
    setConstraint(
      constraint.facingMode === "user"
        ? VideoConstraints.environment
        : VideoConstraints.user,
    );
  }, [constraint.facingMode]);

  const captureImage = () => {
    if (webRef.current) {
      const screenshot = webRef.current.getScreenshot({
        width: 1280,
        height: 720,
      });
      setPreviewImage(screenshot);

      const canvas = webRef.current?.getCanvas();
      if (canvas) {
        // Create a square crop from the center of the webcam image
        const size = Math.min(canvas.width, canvas.height);
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;

        const squareCanvas = document.createElement("canvas");

        // Use a larger canvas size initially for better quality
        squareCanvas.width = size;
        squareCanvas.height = size;

        const ctx = squareCanvas.getContext("2d");

        if (ctx && canvas) {
          // Enable high quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(canvas, x, y, size, size, 0, 0, size, size);

          // Resize to ensure dimensions are less than 400px
          const resizedCanvas = getResizedCanvas(squareCanvas, 400, 400);

          resizedCanvas.toBlob(
            (blob) => {
              if (blob) {
                const myFile = new File([blob], "image.png", {
                  type: "image/png",
                });
                setSelectedFile(myFile);
              } else {
                toast.error(t("failed_to_capture_image"));
              }
            },
            "image/png",
            1.0, // Use maximum quality
          );
        }
      }
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
      toast.error("Failed to stop camera");
    } finally {
      setIsCameraOpen(false);
    }
  }, []);

  const closeModal = () => {
    setPreview(undefined);
    setPreviewImage(null);
    setIsProcessing(false);
    setSelectedFile(undefined);
    setIsCropping(false);
    dragProps.setFileDropError("");
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
      toast.error(t("please_upload_an_image_file"));
      return;
    }

    // Default 1MB = 1048576 bytes
    if (file.size > careConfig.maxImageSize) {
      toast.error(t("image_too_large"));
      return;
    }

    setSelectedFile(file);
    setIsCropping(true);
  };

  // Handle image load to set initial crop
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // Initialize with a centered 1:1 crop
    setCrop(centerAspectCrop(width, height, 1));
  };

  // Apply the crop to canvas
  const applyCrop = useCallback(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      const image = imgRef.current;
      const canvas = previewCanvasRef.current;
      const crop = completedCrop;

      // Get the pixel ratio to handle high-DPI displays
      const pixelRatio = window.devicePixelRatio || 1;

      // Calculate the actual dimensions from the image
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas dimensions to match the crop size, accounting for pixel ratio
      const canvasWidth = crop.width;
      const canvasHeight = crop.height;

      canvas.width = canvasWidth * pixelRatio;
      canvas.height = canvasHeight * pixelRatio;

      // Set display size
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      // Scale the context to account for pixel ratio
      ctx.scale(pixelRatio, pixelRatio);

      // Set high quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw the cropped image
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
      );

      // Convert to blob with high quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], "cropped-image.png", {
              type: "image/png",
            });
            setSelectedFile(croppedFile);
            setIsCropping(false);

            // Create a preview of the cropped image
            const croppedUrl = URL.createObjectURL(blob);
            setPreview(croppedUrl);
          }
        },
        "image/png",
        1.0, // Use maximum quality
      );
    }
  }, [completedCrop]);

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
        },
        () => {
          setPreview(undefined);
          setPreviewImage(null);
          setIsProcessing(false);
        },
      );
    } finally {
      setPreview(undefined);
      setIsProcessing(false);
      setSelectedFile(undefined);
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
      return dragProps.setFileDropError("Please drop an image file to upload!");

    // Default 1MB = 1048576 bytes
    if (droppedFile.size > careConfig.maxImageSize) {
      toast.error(t("image_too_large"));
      return;
    }

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
      <br />
      {t("allowed_formats_are", { formats: "jpg, png, jpeg" })}{" "}
      {t("recommended_aspect_ratio_for", { aspectRatio: "1:1" })}
      <br />
      {t("image_dimensions_should_be_less_than", { maxDimension: "400px" })}
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
          <div className="flex max-h-screen min-h-96 w-full flex-col overflow-auto">
            {!isCameraOpen ? (
              <>
                {isCropping && preview ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-4 text-center">
                      <h3 className="text-lg font-medium">
                        {t("crop_your_image")}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {t("drag_to_reposition_and_resize")}
                      </p>
                    </div>
                    <div className="relative mb-4">
                      <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        circularCrop
                        ruleOfThirds
                        minWidth={100} // Set minimum crop size
                        minHeight={100}
                      >
                        <img
                          ref={imgRef}
                          src={preview || "/placeholder.svg"}
                          alt="Crop preview"
                          onLoad={onImageLoad}
                          className="max-h-[60vh] max-w-full object-contain"
                          crossOrigin="anonymous" // Add this to handle CORS issues
                        />
                      </ReactCrop>
                      <canvas ref={previewCanvasRef} className="hidden" />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCropping(false);
                          setSelectedFile(undefined);
                          setPreview(undefined);
                        }}
                      >
                        {t("cancel")}
                      </Button>
                      <Button variant="primary" onClick={applyCrop}>
                        {t("apply_crop")}
                      </Button>
                    </div>
                  </div>
                ) : preview || imageUrl ? (
                  <>
                    <div className="flex h-[50vh] md:h-[75vh] w-full items-center justify-center rounded-lg border border-secondary-200">
                      <img
                        src={
                          preview && preview.startsWith("blob:")
                            ? DOMPurify.sanitize(preview)
                            : imageUrl
                        }
                        alt="cover-photo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="text-center font-medium text-secondary-700">
                      {hintMessage}
                    </p>
                  </>
                ) : (
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                      "mt-8 flex flex-1 flex-col items-center justify-center rounded-lg border-[3px] border-dashed px-3 py-6",
                      isDragging
                        ? "border-primary-800 bg-primary-100"
                        : dragProps.dragOver
                          ? "border-primary-500"
                          : "border-secondary-500",
                      dragProps.fileDropError !== "" && "border-red-500",
                    )}
                  >
                    <svg
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                      className={cn(
                        "size-12 stroke-[2px]",
                        isDragging
                          ? "text-green-500"
                          : dragProps.dragOver
                            ? "text-primary-500"
                            : "text-secondary-600",
                        dragProps.fileDropError !== "" && "text-red-500",
                      )}
                    >
                      <path d="M28 8H12a4 4 0 0 0-4 4v20m32-12v8m0 0v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-4m32-4-3.172-3.172a4 4 0 0 0-5.656 0L28 28M8 32l9.172-9.172a4 4 0 0 1 5.656 0L28 28m0 0 4 4m4-24h8m-4-4v8m-12 4h.02" />
                    </svg>
                    <p
                      className={cn(
                        "text-sm text-center",
                        dragProps.fileDropError
                          ? "text-red-500"
                          : dragProps.dragOver
                            ? "text-primary-500"
                            : "text-secondary-700",
                      )}
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
                    onClick={() => {
                      setConstraint(() => VideoConstraints.user);
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
                    disabled={isProcessing || !selectedFile || isCropping}
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
                      <div className="relative">
                        <Webcam
                          audio={false}
                          height={720}
                          screenshotFormat="image/jpeg"
                          width={1280}
                          ref={webRef}
                          videoConstraints={constraint}
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
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Captured"
                        className="max-h-[60vh]"
                      />
                    </>
                  )}
                </div>
                {/* buttons for mobile screens */}
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
                    {t("proceed")}
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
