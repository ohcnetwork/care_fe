import careConfig from "@careConfig";
import DOMPurify from "dompurify";
import React, { ChangeEventHandler, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

import CameraCapture from "./CameraCapture";

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

const isImageFile = (file?: File) => file?.type.split("/")[0] === "image";

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCaptureImgBeingUploaded, setIsCaptureImgBeingUploaded] =
    useState(false);
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);

  const closeModal = () => {
    setPreview(undefined);
    setIsProcessing(false);
    setSelectedFile(undefined);
    setIsCameraOpen(false);
    setPreviewImage(null);
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
      await handleUpload(
        selectedFile,
        () => {
          setPreview(undefined);
        },
        () => {
          setPreview(undefined);
          setPreviewImage(null);
          setIsCaptureImgBeingUploaded(false);
          setIsProcessing(false);
        },
      );
    } finally {
      setPreview(undefined);
      setIsCaptureImgBeingUploaded(false);
      setIsProcessing(false);
      setSelectedFile(undefined);
      setIsCameraOpen(false);
      setPreviewImage(null);
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
          <div className="flex max-h-screen min-h-96 w-full flex-col overflow-auto">
            {open && isCameraOpen ? (
              <>
                <CameraCapture
                  isCameraOpen={isCameraOpen}
                  previewImage={previewImage}
                  isProcessing={isProcessing}
                  isCaptureImgBeingUploaded={isCaptureImgBeingUploaded}
                  uploadAvatar={uploadAvatar}
                  setPreviewImage={setPreviewImage}
                  setIsCameraOpen={setIsCameraOpen}
                  setSelectedFile={setSelectedFile}
                />
              </>
            ) : (
              <>
                {preview || imageUrl ? (
                  <>
                    <div className="flex h-[30vh] md:h-[75vh] w-full items-center justify-center rounded-lg border border-secondary-200">
                      <img
                        src={
                          preview && preview.startsWith("blob:")
                            ? DOMPurify.sanitize(preview)
                            : imageUrl
                        }
                        alt="cover-photo"
                        className="h-full w-full object-contain"
                        loading="lazy"
                        decoding="async"
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarEditModal;
