import { t } from "i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { FileUploadModel } from "@/components/Patient/models";

import { FILE_EXTENSIONS } from "@/common/constants";

import { classNames } from "@/Utils/utils";

interface FilePreviewCardProps {
  file: FileUploadModel | File;
  index?: number;
  onRemove?: (index: number) => void;
  readonly?: boolean;
  isPlaying?: boolean;
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
        "relative mt-1 h-20 w-20 cursor-pointer overflow-hidden rounded-lg bg-secondary-100 shadow-sm transition-all duration-200 hover:bg-secondary-200/50",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
      role="button"
      aria-label={t("file_preview")}
    >
      {!readonly && onRemove && typeof index === "number" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="absolute right-0 top-0 z-10 h-5 w-5 rounded-full bg-secondary-300 text-secondary-800 transition-colors duration-200 hover:bg-secondary-400 hover:text-white"
        >
          <CareIcon
            icon="l-times-circle"
            className="text-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        </button>
      )}

      {fileType === "AUDIO" && onPlay ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center p-2"
          role="button"
          tabIndex={0}
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
          <CareIcon
            icon={isPlaying ? "l-pause" : "l-play"}
            className="h-6 w-6 text-primary-600"
          />
          <span className="mt-1 max-h-[2.5em] w-full overflow-hidden text-ellipsis break-words text-center text-xs text-secondary-600">
            {fileName}
          </span>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-2">
          <CareIcon
            icon={icons[fileType]}
            className="shrink-0 text-2xl text-secondary-600"
          />
          <span className="mt-1 max-h-[2.5em] w-full overflow-hidden text-ellipsis break-words text-center text-xs text-secondary-600">
            {fileName}
          </span>
        </div>
      )}
    </div>
  );
}
