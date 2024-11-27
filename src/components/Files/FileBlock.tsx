import dayjs from "dayjs";
import { t } from "i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import { FileUploadModel } from "@/components/Patient/models";

import { FileManagerResult } from "@/hooks/useFileManager";

import { FILE_EXTENSIONS } from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export interface FileBlockProps {
  file: FileUploadModel;
  fileManager: FileManagerResult;
  associating_id: string;
  editable: boolean;
  archivable?: boolean;
}

export default function FileBlock(props: FileBlockProps) {
  const {
    file,
    fileManager,
    associating_id,
    editable = false,
    archivable = false,
  } = props;

  const filetype = fileManager.getFileType(file);

  const fileData = useQuery(routes.retrieveUpload, {
    query: { file_type: fileManager.type, associating_id },
    pathParams: { id: file.id || "" },
    prefetch: filetype === "AUDIO" && !file.is_archived,
  });

  const icons: Record<keyof typeof FILE_EXTENSIONS | "UNKNOWN", IconName> = {
    AUDIO: "l-volume",
    IMAGE: "l-image",
    PRESENTATION: "l-presentation-play",
    VIDEO: "l-video",
    UNKNOWN: "l-file-medical",
    DOCUMENT: "l-file-medical",
  };

  const archived = file.is_archived;

  return (
    <div
      id="file-div"
      className={`flex flex-col justify-between gap-2 rounded-lg border border-secondary-300 lg:flex-row lg:items-center ${archived ? "text-secondary-600" : "bg-white"} px-4 py-2 transition-all hover:bg-secondary-100`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`${archived ? "bg-secondary-100 text-secondary-500" : "bg-primary-500/10 text-primary-700"} flex aspect-square w-14 items-center justify-center rounded-full`}
        >
          <CareIcon icon={icons[filetype]} className="text-4xl" />
        </div>
        <div className="min-w-[40%] break-all">
          <div className="">
            {file.name}
            {file.extension} {file.is_archived && "(Archived)"}
          </div>
          <div className="text-xs text-secondary-700">
            {dayjs(
              file.is_archived ? file.archived_datetime : file.created_date,
            ).format("DD MMM YYYY, hh:mm A")}{" "}
            by{" "}
            {file.is_archived
              ? file.archived_by?.username
              : file.uploaded_by?.username}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {filetype === "AUDIO" && !file.is_archived && (
          <div className="w-full md:w-[300px]">
            <audio
              className="max-h-full w-full object-contain"
              src={fileData.data?.read_signed_url}
              controls
              preload="auto"
              controlsList="nodownload"
            />
          </div>
        )}
        {!file.is_archived &&
          (fileManager.isPreviewable(file) ? (
            <ButtonV2
              onClick={() => fileManager.viewFile(file, associating_id)}
              className="w-full md:w-auto"
            >
              <CareIcon icon="l-eye" />
              {t("view")}
            </ButtonV2>
          ) : (
            <ButtonV2
              onClick={() => fileManager.downloadFile(file, associating_id)}
              className="w-full md:w-auto"
            >
              <CareIcon icon="l-arrow-circle-down" />
              {t("download")}
            </ButtonV2>
          ))}
        <div className="inline-flex w-full gap-2 md:w-auto">
          {!file.is_archived && editable && (
            <ButtonV2
              variant={"secondary"}
              onClick={() => fileManager.editFile(file, associating_id)}
              className="flex-1 md:flex-auto"
            >
              <CareIcon icon={"l-pen"} />
              {t("rename")}
            </ButtonV2>
          )}
          {(file.is_archived || editable) && archivable && (
            <ButtonV2
              variant={file.is_archived ? "primary" : "secondary"}
              onClick={() => fileManager.archiveFile(file, associating_id)}
              className="flex-1 md:flex-auto"
            >
              <CareIcon
                icon={file.is_archived ? "l-info-circle" : "l-archive"}
              />
              {file.is_archived ? t("more_info") : t("archive")}
            </ButtonV2>
          )}
        </div>
      </div>
    </div>
  );
}
