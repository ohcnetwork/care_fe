import DOMPurify from "dompurify";
import React, {
  ChangeEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Cropper from "react-easy-crop";
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

import { getCroppedImg } from "@/Utils/getCroppedImg";
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
  const [isDragging, setIsDragging] = useState(false);
  const { requestPermission } = useMediaDevicePermission();
  const [cropState, setCropState] = useState({
    crop: { x: 0, y: 0 },
    zoom: 1,
    croppedAreaPixels: null as {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null,
    croppedImage: null as string | null,
    isCropping: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSwitchCamera = useCallback(() => {
    setConstraint(
      constraint.facingMode === "user"
        ? VideoConstraints.environment
        : VideoConstraints.user,
    );
  }, [constraint]);

  const onCropComplete = useCallback(
    (
      croppedArea: { x: number; y: number; width: number; height: number },
      croppedAreaPixels: {
        x: number;
        y: number;
        width: number;
        height: number;
      },
    ) => {
      setCropState((prev) => ({ ...prev, croppedAreaPixels }));
    },
    [],
  );

  const captureImage = () => {
    if (webRef.current) {
      const screenshot = webRef.current.getScreenshot();
      if (!screenshot) {
        toast.error(t("failed_to_capture_image"));
        return;
      }
      setPreviewImage(screenshot);

      // Reset crop state when capturing a new image
      setCropState((prev) => ({
        ...prev,
        crop: { x: 0, y: 0 },
        zoom: 1,
        croppedAreaPixels: null,
        croppedImage: null,
        isCropping: true, // Automatically enter cropping mode when capturing an image
      }));

      // Create an image element to process
      const img = new Image();
      img.onload = () => {
        // Create a canvas to resize and process the image
        const canvas = document.createElement("canvas");

        // Make sure dimensions meet backend requirements (min 400x400, max 1024x1024)
        let width = Math.max(400, Math.min(img.width, 1024));
        let height = Math.max(400, Math.min(img.height, 1024));

        // Maintain aspect ratio for the largest dimension
        if (img.width > img.height) {
          height = Math.round(img.height * (width / img.width));
          // Ensure height is at least 400px
          if (height < 400) {
            height = 400;
            width = Math.round(img.width * (height / img.height));
          }
        } else {
          width = Math.round(img.width * (height / img.height));
          // Ensure width is at least 400px
          if (width < 400) {
            width = 400;
            height = Math.round(img.height * (width / img.width));
          }
        }

        canvas.width = width;
        canvas.height = height;
        // Draw resized image to canvas with proper quality
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          toast.error(t("failed_to_process_image"));
          return;
        }

        // Use higher quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to PNG blob - using PNG ensures we don't lose quality in compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Check size limits
              if (blob.size < 1024) {
                // If image is too small, try again with no compression
                canvas.toBlob(
                  (blob2) => {
                    if (blob2 && blob2.size >= 1024) {
                      const myFile = new File([blob2], "camera_image.png", {
                        type: "image/png",
                      });
                      setSelectedFile(myFile);
                    } else {
                      toast.error(t("image_too_small_in_size"));
                    }
                  },
                  "image/png",
                  1.0,
                );
              } else if (blob.size > 2 * 1024 * 1024) {
                // If image is too large, compress more
                canvas.toBlob(
                  (blob2) => {
                    if (blob2 && blob2.size <= 2 * 1024 * 1024) {
                      const myFile = new File([blob2], "camera_image.jpg", {
                        type: "image/jpeg",
                      });
                      setSelectedFile(myFile);
                    } else {
                      // If still too large, use lower resolution
                      const smallerCanvas = document.createElement("canvas");
                      smallerCanvas.width = width * 0.8;
                      smallerCanvas.height = height * 0.8;
                      const smallerCtx = smallerCanvas.getContext("2d");
                      smallerCtx?.drawImage(
                        img,
                        0,
                        0,
                        smallerCanvas.width,
                        smallerCanvas.height,
                      );
                      smallerCanvas.toBlob(
                        (blob3) => {
                          if (blob3) {
                            const myFile = new File(
                              [blob3],
                              "camera_image.jpg",
                              {
                                type: "image/jpeg",
                              },
                            );
                            setSelectedFile(myFile);
                          } else {
                            toast.error(t("failed_to_process_image"));
                          }
                        },
                        "image/jpeg",
                        0.7,
                      );
                    }
                  },
                  "image/jpeg",
                  0.85,
                );
              } else {
                // Size is within the acceptable range
                const myFile = new File([blob], "camera_image.png", {
                  type: "image/png",
                });
                setSelectedFile(myFile);
              }
            } else {
              toast.error(t("failed_to_capture_image"));
            }
          },
          "image/png",
          0.9,
        );
      };

      img.onerror = () => {
        toast.error(t("failed_to_process_image"));
      };
      img.src = screenshot;
    } else {
      toast.error(t("camera_not_available"));
    }
  };

  const handleCropImage = async () => {
    if (!previewImage && !preview) {
      return;
    }

    setIsProcessing(true);
    const imageSrc = previewImage || preview;

    try {
      if (!cropState.croppedAreaPixels) {
        toast.error(t("AVATAR_EDIT__NO_AREA_SELECTED"));
        return;
      }

      // Set a maximum size for cropped images to ensure they don't exceed server limits
      const croppedImage = await getCroppedImg(
        imageSrc as string,
        cropState.croppedAreaPixels,
      );

      // Make sure we have a valid cropped image result
      if (!croppedImage) {
        toast.error(t("AVATAR_EDIT__UNABLE_TO_CROP"));
        return;
      }

      setCropState((prev) => ({ ...prev, croppedImage }));
      // Clear any previous error messages when cropping succeeds
      setErrorMessage(null);
    } catch (error) {
      console.error("Cropping error:", error);
      toast.error(t("AVATAR_EDIT__UNABLE_TO_CROP"));
      setCropState((prev) => ({ ...prev, croppedImage: null }));
      setErrorMessage(t("AVATAR_EDIT__CROPPING_ERROR"));
    } finally {
      setIsProcessing(false);
      setCropState((prev) => ({ ...prev, isCropping: false }));
    }
  };

  useEffect(() => {
    if (cropState.croppedImage) {
      const processCroppedImage = async () => {
        try {
          // Create an Image element to ensure consistent processing
          const img = new Image();
          img.onload = async () => {
            try {
              // Create a canvas for resizing and format conversion
              const canvas = document.createElement("canvas");
              // Ensure minimum dimensions of 400x400 and maximum of 1024x1024
              const MIN_DIMENSION = 400;
              const MAX_DIMENSION = 1024;
              // Calculate optimal dimensions while maintaining aspect ratio
              let size = Math.min(
                MAX_DIMENSION,
                Math.max(MIN_DIMENSION, img.width, img.height),
              );
              let width = size;
              let height = size;

              // Adjust for non-square images while maintaining aspect ratio
              if (img.width !== img.height) {
                if (img.width > img.height) {
                  height = Math.round(img.height * (width / img.width));
                  if (height < MIN_DIMENSION) {
                    height = MIN_DIMENSION;
                    width = Math.round(img.width * (height / img.height));
                  }
                } else {
                  width = Math.round(img.width * (height / img.height));
                  if (width < MIN_DIMENSION) {
                    width = MIN_DIMENSION;
                    height = Math.round(img.height * (width / img.width));
                  }
                }
              }
              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext("2d");
              if (!ctx) {
                throw new Error("Failed to get canvas context");
              }

              // Use high quality rendering
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";

              // Draw the image centered
              ctx.drawImage(
                img,
                0,
                0,
                width,
                height, // Use full canvas
              );

              // Try PNG first (better quality)
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    throw new Error("Failed to create blob");
                  }

                  // Check size constraints
                  if (blob.size < 1024) {
                    // Less than 1KB
                    // Try with no compression
                    canvas.toBlob(
                      (blob2) => {
                        if (blob2 && blob2.size >= 1024) {
                          createFileFromBlob(blob2, "image/png");
                        } else {
                          setErrorMessage(t("image_too_small_in_size"));
                        }
                      },
                      "image/png",
                      1.0, // No compression
                    );
                  } else if (blob.size > 2 * 1024 * 1024) {
                    // Greater than 2MB
                    // Try JPEG with compression
                    canvas.toBlob(
                      (blob2) => {
                        if (blob2 && blob2.size <= 2 * 1024 * 1024) {
                          createFileFromBlob(blob2, "image/jpeg");
                        } else {
                          // If still too large, reduce dimensions
                          const smallerCanvas =
                            document.createElement("canvas");
                          smallerCanvas.width = Math.round(width * 0.8);
                          smallerCanvas.height = Math.round(height * 0.8);
                          const smallerCtx = smallerCanvas.getContext("2d");

                          if (smallerCtx) {
                            smallerCtx.imageSmoothingEnabled = true;
                            smallerCtx.imageSmoothingQuality = "high";
                            smallerCtx.drawImage(
                              img,
                              0,
                              0,
                              smallerCanvas.width,
                              smallerCanvas.height,
                            );

                            smallerCanvas.toBlob(
                              (blob3) => {
                                if (blob3) {
                                  createFileFromBlob(blob3, "image/jpeg");
                                } else {
                                  setErrorMessage(
                                    t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"),
                                  );
                                }
                              },
                              "image/jpeg",
                              0.7, // Higher compression
                            );
                          } else {
                            setErrorMessage(
                              t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"),
                            );
                          }
                        }
                      },
                      "image/jpeg",
                      0.85, // Moderate compression
                    );
                  } else {
                    // Size is within acceptable range
                    createFileFromBlob(blob, "image/png");
                  }
                },
                "image/png",
                0.9, // Light compression
              );

              // Helper function to create a file from blob and update state
              function createFileFromBlob(blob: Blob, mimeType: string) {
                const extension = mimeType === "image/png" ? "png" : "jpg";
                const myFile = new File([blob], `cropped_image.${extension}`, {
                  type: mimeType,
                });
                setSelectedFile(myFile);
                setPreview(cropState.croppedImage!);
                setCropState((prev) => ({ ...prev, croppedImage: null }));
                // Reset loading states to ensure they only appear when submitting
                setIsCaptureImgBeingUploaded(false);
                setIsProcessing(false);
                setErrorMessage(null);
              }
            } catch (err) {
              console.error("Canvas processing error:", err);
              setErrorMessage(t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"));
            }
          };

          img.onerror = () => {
            setErrorMessage(t("AVATAR_EDIT__ERROR_LOADING_IMAGE"));
          };

          img.src = cropState.croppedImage!;
        } catch (error) {
          console.error("Image processing error:", error);
          toast.error(t("AVATAR_EDIT__ERROR_PROCESSING_IMAGE"));
        }
      };
      processCroppedImage();
    }
  }, [cropState.croppedImage, t]);

  const closeModal = () => {
    setPreview(undefined);
    setIsProcessing(false);
    setSelectedFile(undefined);
    setPreviewImage(null);
    setIsCaptureImgBeingUploaded(false);
    setCropState({
      crop: { x: 0, y: 0 },
      zoom: 1,
      croppedAreaPixels: null,
      croppedImage: null,
      isCropping: false,
    });
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
    setCropState((prev) => ({
      ...prev,
      crop: { x: 0, y: 0 },
      zoom: 1,
      croppedAreaPixels: null,
      isCropping: true,
    }));
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
    setCropState((prev) => ({
      ...prev,
      crop: { x: 0, y: 0 },
      zoom: 1,
      croppedAreaPixels: null,
      isCropping: true,
    }));
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
      <DialogContent className="md:max-w-4xl">
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
                        {cropState.isCropping ? (
                          <Cropper
                            image={preview || imageUrl || ""}
                            crop={cropState.crop}
                            zoom={cropState.zoom}
                            aspect={1}
                            onCropChange={(crop) =>
                              setCropState((prev) => ({
                                ...prev,
                                crop,
                              }))
                            }
                            onZoomChange={(zoom) =>
                              setCropState((prev) => ({
                                ...prev,
                                zoom,
                              }))
                            }
                            onCropComplete={onCropComplete}
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
                  {cropState.isCropping && (
                    <div className="flex gap-4 relative justify-center md:absolute md:bottom-5 md:left-1/2 md:transform md:-translate-x-1/2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCropState({
                            crop: { x: 0, y: 0 },
                            zoom: 1,
                            croppedAreaPixels: null,
                            croppedImage: null,
                            isCropping: false,
                          });
                        }}
                      >
                        {t("cancel")}
                      </Button>
                      <Button onClick={handleCropImage} variant="primary">
                        {t("crop")}
                      </Button>
                    </div>
                  )}
                  {preview && !cropState.isCropping && (
                    <Button
                      variant="primary"
                      onClick={() =>
                        setCropState((prev) => ({
                          ...prev,
                          crop: { x: 0, y: 0 },
                          zoom: 1,
                          croppedAreaPixels: null,
                          isCropping: true,
                        }))
                      }
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
                      {cropState.isCropping ? (
                        <div className="aspect-square max-w-[720px] w-full overflow-hidden relative">
                          <Cropper
                            image={previewImage || ""}
                            crop={cropState.crop}
                            zoom={cropState.zoom}
                            aspect={1}
                            onCropChange={(crop) =>
                              setCropState((prev) => ({
                                ...prev,
                                crop,
                              }))
                            }
                            onZoomChange={(zoom) =>
                              setCropState((prev) => ({
                                ...prev,
                                zoom,
                              }))
                            }
                            onCropComplete={onCropComplete}
                          />
                        </div>
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
                      {cropState.isCropping ? (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => {
                              setCropState({
                                crop: { x: 0, y: 0 },
                                zoom: 1,
                                croppedAreaPixels: null,
                                croppedImage: null,
                                isCropping: false,
                              });
                            }}
                          >
                            {t("cancel")}
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleCropImage}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <CareIcon
                                icon="l-spinner"
                                className="animate-spin text-lg"
                              />
                            ) : (
                              t("crop")
                            )}
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
                            onClick={() =>
                              setCropState((prev) => ({
                                ...prev,
                                crop: { x: 0, y: 0 },
                                zoom: 1,
                                croppedAreaPixels: null,
                                isCropping: true,
                              }))
                            }
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
                      setCropState({
                        crop: { x: 0, y: 0 },
                        zoom: 1,
                        croppedAreaPixels: null,
                        croppedImage: null,
                        isCropping: false,
                      });
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
