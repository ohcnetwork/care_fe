import { Camera, FilePlus2, Mic, Upload } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { FileUploadReturn } from "@/hooks/useFileUpload";

interface FileUploadDropdownProps {
  fileUpload: FileUploadReturn;
  showAudioCapture?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  buttonClassName?: string;
  buttonText?: string;
  disabled?: boolean;
}

export default function FileUploadDropdown({
  fileUpload,
  showAudioCapture = true,
  inputRef,
  buttonVariant = "outline",
  buttonClassName,
  buttonText,
  disabled = false,
}: FileUploadDropdownProps) {
  const { t } = useTranslation();
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = inputRef ?? internalInputRef;

  return (
    <DropdownMenu>
      <fileUpload.Input className="hidden" ref={fileInputRef} />
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={buttonVariant}
          className={buttonClassName}
          disabled={disabled}
        >
          <FilePlus2 />
          {buttonText ?? t("add_files")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
          <Upload />
          {t("choose_file")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => fileUpload.handleCameraCapture()}>
          <Camera />
          {t("open_camera")}
        </DropdownMenuItem>
        {showAudioCapture && (
          <DropdownMenuItem onSelect={() => fileUpload.handleAudioCapture()}>
            <Mic />
            {t("record")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
