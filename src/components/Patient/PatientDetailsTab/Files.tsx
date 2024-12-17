import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Loading from "@/components/Common/Loading";

import useFileManager from "@/hooks/useFileManager";
import useFileUpload from "@/hooks/useFileUpload";
import useFilters from "@/hooks/useFilters";

import { FILE_EXTENSIONS } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { classNames } from "@/Utils/utils";

import { PatientProps } from ".";
import { FileUploadModel } from "../models";

const PatientFiles = (props: PatientProps) => {
  const { patientData, id } = props;
  const { qParams, updateQuery } = useFilters({});
  const { t } = useTranslation();

  const fileCategories = [
    { value: "all", label: "All" },
    { value: "imaging", label: "Imaging" },
    { value: "lab_reports", label: "Lab Reports" },
    { value: "documents", label: "Documents" },
    { value: "audio", label: "Audio" },
  ];

  const handleTabChange = (value: string) => {
    updateQuery({ file_category: value === "all" ? undefined : value });
  };

  const {
    data: files,
    isLoading: filesLoading,
    refetch,
  } = useQuery({
    queryKey: ["patient-files", patientData.id, qParams.is_archived],
    queryFn: async () => {
      const response = await request(routes.viewUpload, {
        query: {
          file_type: "PATIENT",
          associating_id: id,
          limit: qParams.limit,
          offset: qParams.offset,
          ...(qParams.is_archived !== undefined && {
            is_archived: qParams.is_archived,
          }),
          //file_category: qParams.file_category,
        },
      });
      return response.data;
    },
  });

  const fileManager = useFileManager({
    type: "PATIENT",
    onArchive: refetch,
    onEdit: refetch,
    uploadedFiles:
      files?.results
        .slice()
        .reverse()
        .map((file) => ({
          ...file,
          associating_id: id,
        })) || [],
  });

  const fileUpload = useFileUpload({
    type: "PATIENT",
    allowedExtensions: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "tiff",
      "mp4",
      "mov",
      "avi",
      "wmv",
      "mp3",
      "wav",
      "ogg",
      "txt",
      "csv",
      "rtf",
      "doc",
      "odt",
      "pdf",
      "xls",
      "xlsx",
      "ods",
      "pdf",
    ],
    allowNameFallback: false,
    onUpload: () => refetch(),
  });

  const getFileType = (file: FileUploadModel) => {
    return fileManager.getFileType(file);
  };

  if (filesLoading) return <Loading />;

  const icons: Record<keyof typeof FILE_EXTENSIONS | "UNKNOWN", IconName> = {
    AUDIO: "l-volume",
    IMAGE: "l-image",
    PRESENTATION: "l-presentation-play",
    VIDEO: "l-video",
    UNKNOWN: "l-file-medical",
    DOCUMENT: "l-file-medical",
  };

  const getTableHeaders = () => {
    return (
      <thead>
        <tr>
          <th className="flex flex-row justify-between items-center border-2 rounded-lg text-sm font-normal">
            <td width="20%" className="pl-4 py-2 text-left">
              {t("file_name")}
            </td>
            <td width="10%" className="py-2 text-left">
              {t("file_type")}
            </td>
            <td width="25%" className="py-2 text-left">
              {t("date")}
            </td>
            <td width="15%" className="py-2 text-left">
              {t("shared_by")}
            </td>
            <td width="30%" className="py-2 text-left"></td>
          </th>
        </tr>
      </thead>
    );
  };

  const GetButtons = (file: FileUploadModel) => {
    const filetype = getFileType(file);
    const fileData = useQuery({
      queryKey: [routes.retrieveUpload, "PATIENT", file.id],
      queryFn: async () => {
        const response = await request(routes.retrieveUpload, {
          query: { file_type: "PATIENT", associating_id: id },
          pathParams: { id: file.id || "" },
        });
        return response.data;
      },
      enabled: filetype === "AUDIO" && !file.is_archived,
    });
    return (
      <div className="flex flex-row gap-2 justify-end">
        {filetype === "AUDIO" && (
          <div className="w-full md:w-[300px]">
            <audio
              className="max-h-full w-full object-contain rounded-lg"
              src={fileData.data?.read_signed_url}
              controls
              preload="auto"
              controlsList="nodownload"
            />
          </div>
        )}
        {fileManager.isPreviewable(file) && (
          <Button
            variant="secondary"
            onClick={() => fileManager.viewFile(file, id)}
          >
            <span className="flex flex-row items-center gap-1">
              <CareIcon icon="l-eye" />
              {t("view")}
            </span>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              <CareIcon icon="l-ellipsis-h" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-2">
            <DropdownMenuItem className="text-primary-900">
              <button onClick={() => fileManager.downloadFile(file, id)}>
                <CareIcon icon="l-arrow-circle-down" className="mr-1" />
                <span>{t("download")}</span>
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-primary-900">
              <button onClick={() => fileManager.archiveFile(file, id)}>
                <CareIcon icon="l-archive-alt" className="mr-1" />
                <span>{t("archive")}</span>
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-primary-900">
              <button onClick={() => fileManager.editFile(file, id)}>
                <CareIcon icon="l-pen" className="mr-1" />
                <span>{t("rename")}</span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const getArchivedMessage = () => {
    return (
      <div className="flex flex-row gap-2 justify-end">
        <span className="text-gray-200/90 text-2xl uppercase font-bold">
          {t("archived")}
        </span>
      </div>
    );
  };

  const getFilterButton = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="text-sm text-secondary-800">
            <span className="flex flex-row items-center gap-1">
              <CareIcon icon="l-filter" />
              <span>{t("filter")}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-2">
          <DropdownMenuItem
            className="text-primary-900"
            onClick={() => {
              updateQuery({ is_archived: "false" });
            }}
          >
            <span>{t("active_files")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-primary-900"
            onClick={() => {
              updateQuery({ is_archived: "true" });
            }}
          >
            <span>{t("archived_files")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const getFilterBadges = () => {
    if (typeof qParams.is_archived === "undefined")
      return <div className="mt-10" />;
    return (
      <div className="flex flex-row gap-2 mt-2">
        <Badge
          variant="secondary"
          className="cursor-pointer border border-gray-300 bg-white"
          onClick={() => updateQuery({ is_archived: undefined })}
        >
          {t(
            qParams.is_archived === "false" ? "active_files" : "archived_files",
          )}
          <CareIcon icon="l-times-circle" className="ml-1" />
        </Badge>
      </div>
    );
  };

  const getFileUploadButtons = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline_primary"
            className="flex flex-row items-center"
          >
            <CareIcon icon="l-file-upload" className="mr-1" />
            <span>{t("add_files")}</span>
            <CareIcon icon="l-angle-down" className="ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-full">
          <DropdownMenuItem className="flex flex-row items-center">
            <label
              htmlFor="file_upload_patient"
              className="flex flex-row items-center cursor-pointer  text-primary-900 font-normal"
            >
              <CareIcon icon="l-file-upload-alt" className="mr-1" />
              <span>{t("choose_file")}</span>
            </label>
            {fileUpload.Input({ className: "hidden" })}
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-row items-center text-primary-900">
            <button
              onClick={() => fileUpload.handleCameraCapture()}
              className="flex flex-row items-center "
            >
              <CareIcon icon="l-camera" className="mr-1" />
              <span>{t("open_camera")}</span>
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-row items-center text-primary-900">
            <button
              onClick={() => fileUpload.handleAudioCapture()}
              className="flex flex-row items-center"
            >
              <CareIcon icon="l-microphone" className="mr-1" />
              <span>{t("record")}</span>
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const getTableRow = (file: FileUploadModel) => {
    const filetype = getFileType(file);
    return (
      <tr
        key={file.id}
        className={classNames(
          "flex border border-secondary-300 flex-row grow justify-between items-center mt-3 mb-4 rounded-lg p-4 shadow text-sm",
          file.is_archived ? "bg-white/50" : "bg-white",
        )}
      >
        <td width="20%">
          <span className="inline-flex items-center gap-2">
            <span className="p-2 rounded-full bg-gray-100">
              <CareIcon icon={icons[filetype]} className="text-xl" />
            </span>
            {file.name && file.name.length > 10 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-gray-900">
                      {file.name?.slice(0, 8) + "..."}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white z-40">
                    <span>
                      {file.name}
                      {file.extension}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-gray-900">
                {file.name}
                {file.extension}
              </span>
            )}
          </span>
        </td>
        <td width="10%">{filetype}</td>
        <td width="25%">
          {dayjs(file.created_date).format("DD MMM YYYY, hh:mm A")}
        </td>
        <td width="15%">{file.uploaded_by?.username}</td>
        <td width="30%">
          {file.is_archived ? getArchivedMessage() : GetButtons(file)}
        </td>
      </tr>
    );
  };

  const RenderTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          {getTableHeaders()}
          <tbody>
            {files?.results?.map((file) => {
              return getTableRow(file);
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="z-40">
        {fileUpload.Dialogues}
        {fileManager.Dialogues}
      </div>
      <Tabs
        defaultValue="all"
        value={qParams.file_category || "all"}
        onValueChange={handleTabChange}
      >
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-3 items-center">
            <TabsList>
              {fileCategories.map((category) => (
                <TabsTrigger
                  key={category.value}
                  value={category.value}
                  className="hover:text-secondary-900 hover:bg-white/50 mr-4"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {getFilterButton()}
          </div>
          {getFileUploadButtons()}
        </div>
        {getFilterBadges()}
        {fileCategories.map((category) => (
          <TabsContent key={category.value} value={category.value}>
            <RenderTable />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PatientFiles;
