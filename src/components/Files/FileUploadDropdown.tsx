import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

import { FileUploadReturn } from "@/hooks/useFileUpload";

interface FileUploadDropdownProps {
  fileUpload: FileUploadReturn;
  showAudioCapture?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  buttonClassName?: string;
  buttonText?: string;
}

export default function FileUploadDropdown({
  fileUpload,
  showAudioCapture = true,
  inputRef,
  buttonVariant = "outline",
  buttonClassName = "flex flex-row items-center",
  buttonText,
}: FileUploadDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const prevFileCount = useRef(fileUpload.files.length);

  // Auto-close dropdown when new files are added (after file picker closes)
  useEffect(() => {
    if (fileUpload.files.length > prevFileCount.current) {
      setOpen(false);
    }
    prevFileCount.current = fileUpload.files.length;
  }, [fileUpload.files.length]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={buttonVariant}
          className={buttonClassName}
        >
          <CareIcon icon="l-file-upload" className="mr-1" />
          <span>{buttonText ?? t("add_files")}</span>
          <CareIcon icon="l-angle-down" className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[calc(100vw-2.5rem)] sm:w-full"
      >
        <DropdownMenuItem
          className="flex flex-row items-center"
          onSelect={(e) => {
            e.preventDefault();
          }}
          aria-label={t("choose_file")}
        >
          <Label className="flex items-center w-full text-primary-900 hover:text-black py-1 font-medium">
            <CareIcon icon="l-file-upload-alt" />
            <span>{t("choose_file")}</span>
            {fileUpload.Input({
              className: "hidden",
              ...(inputRef ? { ref: inputRef } : {}),
            })}
          </Label>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => fileUpload.handleCameraCapture()}
          className="flex items-center text-primary-900 font-medium"
          aria-label={t("open_camera")}
        >
          <CareIcon icon="l-camera" />
          <span>{t("open_camera")}</span>
        </DropdownMenuItem>
        {showAudioCapture && (
          <DropdownMenuItem
            onSelect={() => fileUpload.handleAudioCapture()}
            className="flex items-center text-primary-900 font-medium"
            aria-label={t("record")}
          >
            <CareIcon icon="l-microphone" />
            <span>{t("record")}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
