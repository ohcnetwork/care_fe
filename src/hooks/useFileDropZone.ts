import { t } from "i18next";
import { useState } from "react";
import { toast } from "sonner";

interface UseFileDropZoneOptions {
  onFilesDropped: (files: File[]) => void;
  allowedExtensions: string[];
  existingFiles: File[];
  canEdit?: boolean;
}

export default function useFileDropZone({
  onFilesDropped,
  allowedExtensions,
  existingFiles,
  canEdit = true,
}: UseFileDropZoneOptions) {
  const [isDragging, setIsDragging] = useState(false);

  const isDuplicateFile = (newFile: File): boolean => {
    return existingFiles.some(
      (file) => file.name === newFile.name && file.size === newFile.size,
    );
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (canEdit && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!canEdit) return;

    // Extract files from dataTransfer
    let droppedFiles: File[] = [];
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      droppedFiles = Array.from(e.dataTransfer.files);
    } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) droppedFiles.push(file);
        }
      }
    }

    // Validate files
    const validFiles: File[] = [];
    const duplicateFiles: string[] = [];
    const invalidFiles: string[] = [];

    droppedFiles.forEach((file) => {
      if (isDuplicateFile(file)) {
        duplicateFiles.push(file.name);
        return;
      }

      if (file.size > 10e7) {
        invalidFiles.push(`${file.name} (${t("file_error__file_size")})`);
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase();
      if (
        !allowedExtensions
          .map((ext) => ext.replace(".", "").toLowerCase())
          .includes(extension || "")
      ) {
        invalidFiles.push(
          `${file.name} (${t("file_error__file_type", { extension })})`,
        );
        return;
      }

      validFiles.push(file);
    });

    // Show notifications
    if (duplicateFiles.length > 0) {
      toast.warning(
        t("duplicate_files_skipped", {
          count: duplicateFiles.length,
          files: duplicateFiles.join(", "),
        }),
      );
    }

    if (invalidFiles.length > 0) {
      toast.error(
        t("invalid_files_skipped", {
          count: invalidFiles.length,
          files: invalidFiles.join(", "),
        }),
      );
    }

    // Process valid files
    if (validFiles.length > 0) {
      onFilesDropped(validFiles);
    }
  };

  return {
    isDragging,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}
