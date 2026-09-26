import { useRef } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
  /** Withholds the whole add-files affordance (file picker, camera, audio)
   *  without unmounting it — a real capability gap this component had no
   *  way to express before: the trigger `Button` stayed clickable even
   *  while a consuming section was frozen (e.g. a structured question mid-
   *  submit), so a pick made during that window reached a `disabled`
   *  mutator that silently no-opped, with no visible reason. Defaults to
   *  `false` so every existing caller (`FileQuestion.tsx`, `FileSubTab.tsx`,
   *  `ConsentFormSheet.tsx`, `ConsentDetail.tsx`) is unaffected. */
  disabled?: boolean;
}

export default function FileUploadDropdown({
  fileUpload,
  showAudioCapture = true,
  inputRef,
  buttonVariant = "outline",
  buttonClassName = "flex flex-row items-center",
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
          className="flex flex-row items-center text-primary-900 font-medium"
          onSelect={() => fileInputRef.current?.click()}
          aria-label={t("choose_file")}
        >
          <CareIcon icon="l-file-upload-alt" />
          <span>{t("choose_file")}</span>
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
