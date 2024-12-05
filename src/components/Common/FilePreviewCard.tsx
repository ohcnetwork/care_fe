import { t } from "i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { FileUploadModel } from "@/components/Patient/models";

import { FILE_EXTENSIONS } from "@/common/constants";

import { classNames } from "@/Utils/utils";

interface FilePreviewCardProps {
  file: FileUploadModel | File;
  index?: number;
  onRemove?: (index: number) => void;
  readonly?: boolean;
  isPlaying?: boolean;
  isLoading?: boolean;
  onPlay?: () => void;
  onClick?: () => void;
}

const icons: Record<keyof typeof FILE_EXTENSIONS | "UNKNOWN", IconName> = {
  AUDIO: "l-volume",
  IMAGE: "l-image",
  PRESENTATION: "l-presentation-play",
  VIDEO: "l-video",
  UNKNOWN: "l-file-medical",
  DOCUMENT: "l-file-medical",
};

export function FilePreviewCard({
  file,
  index,
  onRemove,
  readonly = false,
  isPlaying,
  isLoading,
  onPlay,
  onClick,
}: FilePreviewCardProps) {
  const getFileType = (file: FileUploadModel) => {
    if (!file.extension) return "UNKNOWN";
    const ftype = (
      Object.keys(FILE_EXTENSIONS) as (keyof typeof FILE_EXTENSIONS)[]
    ).find((type) =>
      FILE_EXTENSIONS[type].includes((file.extension?.slice(1) || "") as never),
    );
    return ftype || "UNKNOWN";
  };

  const fileName = file instanceof File ? file.name : file.name;
  const fileType = getFileType(file);

  return (
    <div
      className={classNames(
        "group relative mt-1 h-16 w-16 overflow-hidden rounded-lg bg-secondary-300/40 shadow-sm",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
      role="button"
      aria-label={t("file_preview")}
    >
      {!readonly && onRemove && typeof index === "number" && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          size="icon"
          variant="ghost"
          className="absolute right-0 top-0 z-10 h-4 w-4 rounded-full bg-secondary-400 p-0 text-secondary-800 hover:bg-secondary-500"
        >
          <CareIcon
            icon="l-times-circle"
            className="text-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        </Button>
      )}

      {fileType === "AUDIO" && onPlay ? (
        <Button
          variant="ghost"
          className="flex h-full w-full flex-col items-center justify-center p-2"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onPlay();
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
        >
          {isLoading ? (
            <CareIcon
              icon="l-spinner"
              className="h-6 w-6 animate-spin text-primary-600"
            />
          ) : (
            <CareIcon
              icon={isPlaying ? "l-pause" : "l-play"}
              className="h-6 w-6 text-primary-600"
            />
          )}
          <span className="mt-1 max-h-[2.5em] w-full overflow-hidden text-ellipsis break-words text-center text-xs text-secondary-600">
            {fileName}
          </span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          className="flex h-full w-full flex-col items-center justify-center p-2"
        >
          <CareIcon
            icon={icons[fileType]}
            className="shrink-0 text-2xl text-secondary-600"
          />
          <span className="mt-1 max-h-[2.5em] w-full overflow-hidden text-ellipsis break-words text-center text-[10px] text-secondary-600">
            {fileName}
          </span>
        </Button>
      )}
    </div>
  );
}
