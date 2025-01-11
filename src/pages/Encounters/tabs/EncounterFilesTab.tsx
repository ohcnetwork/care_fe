import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import AudioPlayer from "@/components/Common/AudioPlayer";
import Loading from "@/components/Common/Loading";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FileUploadModel } from "@/components/Patient/models";

import useFileManager from "@/hooks/useFileManager";
import useFileUpload, { FileUploadReturn } from "@/hooks/useFileUpload";
import useFilters from "@/hooks/useFilters";

import { FILE_EXTENSIONS } from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { classNames } from "@/Utils/utils";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterFilesTab = (props: EncounterTabProps) => {
  const { encounter } = props;
  const { qParams, updateQuery } = useFilters({});
  const { t } = useTranslation();
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] =
    useState<FileUploadModel | null>(null);
  const [openAudioPlayerDialog, setOpenAudioPlayerDialog] = useState(false);

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
    queryKey: ["encounter-files", encounter.id, qParams.is_archived],
    queryFn: query(routes.viewUpload, {
      queryParams: {
        file_type: "encounter",
        associating_id: encounter.id,
        limit: qParams.limit,
        offset: qParams.offset,
        ...(qParams.is_archived !== undefined && {
          is_archived: qParams.is_archived,
        }),
        //file_category: qParams.file_category,
      },
    }),
  });

  const fileManager = useFileManager({
    type: "encounter",
    onArchive: refetch,
    onEdit: refetch,
    uploadedFiles:
      files?.results
        .slice()
        .reverse()
        .map((file) => ({
          ...file,
          associating_id: encounter.id,
        })) || [],
  });

  const fileUpload = useFileUpload({
    type: "encounter",
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

  useEffect(() => {
    if (fileUpload.files.length > 0 && fileUpload.files[0] !== undefined) {
      setOpenUploadDialog(true);
    } else {
      setOpenUploadDialog(false);
    }
  }, [fileUpload.files]);

  useEffect(() => {
    if (!openUploadDialog) {
      fileUpload.clearFiles();
    }
  }, [openUploadDialog]);

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

  const getArchivedMessage = () => {
    return (
      <div className="flex flex-row gap-2 justify-end">
        <span className="text-gray-200/90 text-2xl uppercase font-bold">
          {t("archived")}
        </span>
      </div>
    );
  };

  const DetailButtons = ({ file }: { file: FileUploadModel }) => {
    const filetype = getFileType(file);
    return (
      <div className="flex flex-row gap-2 justify-end">
        {filetype === "AUDIO" && !file.is_archived && (
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedAudioFile(file);
              setOpenAudioPlayerDialog(true);
            }}
          >
            <span className="flex flex-row items-center gap-1">
              <CareIcon icon="l-play-circle" className="mr-1" />
              {t("play")}
            </span>
          </Button>
        )}
        {fileManager.isPreviewable(file) && (
          <Button
            variant="secondary"
            onClick={() => fileManager.viewFile(file, encounter.id)}
          >
            <span className="flex flex-row items-center gap-1">
              <CareIcon icon="l-eye" />
              {t("view")}
            </span>
          </Button>
        )}
        {
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <CareIcon icon="l-ellipsis-h" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem className="text-primary-900">
                <button
                  onClick={() => fileManager.downloadFile(file, encounter.id)}
                >
                  <CareIcon icon="l-arrow-circle-down" className="mr-1" />
                  <span>{t("download")}</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-primary-900">
                <button
                  onClick={() => fileManager.archiveFile(file, encounter.id)}
                >
                  <CareIcon icon="l-archive-alt" className="mr-1" />
                  <span>{t("archive")}</span>
                </button>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-primary-900">
                <button
                  onClick={() => fileManager.editFile(file, encounter.id)}
                >
                  <CareIcon icon="l-pen" className="mr-1" />
                  <span>{t("rename")}</span>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      </div>
    );
  };

  const FilterButton = () => {
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
        <DropdownMenuContent
          align="start"
          className="w-[calc(100vw-2.5rem)] sm:w-[calc(100%-2rem)]"
        >
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

  const FilterBadges = () => {
    if (typeof qParams.is_archived === "undefined") return <></>;
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

  const FileUploadButtons = (): JSX.Element => {
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
        <DropdownMenuContent
          align="end"
          className="w-[calc(100vw-2.5rem)] sm:w-full"
        >
          <DropdownMenuItem
            className="flex flex-row items-center"
            onSelect={(e) => {
              e.preventDefault();
            }}
          >
            <label
              htmlFor="file_upload_patient"
              className="flex flex-row items-center cursor-pointer text-primary-900 font-normal w-full"
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

  const RenderTable = () => {
    return (
      <Table className="border-separate border-spacing-y-3 mx-2 min-w-[800px] lg:max-w-[calc(100%-16px)]">
        <TableHeader>
          <TableRow className="shadow rounded overflow-hidden">
            <TableHead className="w-[30%] bg-white rounded-l">
              {t("file_name")}
            </TableHead>
            <TableHead className="w-[15%] rounded-y bg-white">
              {t("file_type")}
            </TableHead>
            <TableHead className="w-[25%] rounded-y bg-white">
              {t("date")}
            </TableHead>
            <TableHead className="w-[15%] rounded-y bg-white">
              {t("shared_by")}
            </TableHead>
            <TableHead className="w-[15%] text-right rounded-r bg-white"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files?.results?.map((file) => {
            const filetype = getFileType(file);
            const fileName = file.name ? file.name + file.extension : "";

            return (
              <TableRow
                key={file.id}
                className={classNames(
                  "shadow rounded-md overflow-hidden group",
                )}
              >
                <TableCell
                  className={classNames(
                    "font-medium rounded-l-md rounded-y-md group-hover:bg-transparent",
                    file.is_archived ? "bg-white/50" : "bg-white",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-full bg-gray-100 shrink-0">
                      <CareIcon icon={icons[filetype]} className="text-xl" />
                    </span>
                    {file.name && file.name.length > 20 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="truncate">
                            <span className="text-gray-900 truncate block">
                              {fileName}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-black text-white z-40">
                            <span>{fileName}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-gray-900 truncate block">
                        {fileName}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell
                  className={classNames(
                    "rounded-y-md group-hover:bg-transparent",
                    file.is_archived ? "bg-white/50" : "bg-white",
                  )}
                >
                  {filetype}
                </TableCell>
                <TableCell
                  className={classNames(
                    "rounded-y-md group-hover:bg-transparent",
                    file.is_archived ? "bg-white/50" : "bg-white",
                  )}
                >
                  {dayjs(file.created_date).format("DD MMM YYYY, hh:mm A")}
                </TableCell>
                <TableCell
                  className={classNames(
                    "rounded-y-md group-hover:bg-transparent",
                    file.is_archived ? "bg-white/50" : "bg-white",
                  )}
                >
                  {file.uploaded_by?.username}
                </TableCell>
                <TableCell
                  className={classNames(
                    "text-right rounded-r-md rounded-y-md group-hover:bg-transparent",
                    file.is_archived ? "bg-white/50" : "bg-white",
                  )}
                >
                  {file.is_archived ? (
                    getArchivedMessage()
                  ) : (
                    <DetailButtons file={file} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="z-40">
        {fileUpload.Dialogues}
        {fileManager.Dialogues}
        <AudioPlayerDialog
          open={openAudioPlayerDialog}
          onOpenChange={(open) => {
            setOpenAudioPlayerDialog(open);
            if (!open) {
              setSelectedAudioFile(null);
            }
          }}
          file={selectedAudioFile || null}
          encounterId={encounter.id}
        />
      </div>
      <FileUploadDialog
        open={openUploadDialog}
        onOpenChange={setOpenUploadDialog}
        fileUpload={fileUpload}
        encounterId={encounter.id}
      />
      <Tabs
        defaultValue="all"
        value={qParams.file_category || "all"}
        onValueChange={handleTabChange}
      >
        <div className="mx-2 flex flex-col flex-wrap gap-3 sm:flex-row justify-between">
          <div className="flex sm:flex-row flex-wrap flex-col gap-4 sm:items-center">
            {/* <TabsList className="flex flex-row flex-wrap gap-2 h-auto">
              {fileCategories.map((category) => (
                <TabsTrigger
                  key={category.value}
                  value={category.value}
                  className="hover:text-secondary-900 hover:bg-white/50 mr-4"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList> */}
            <FilterButton />
          </div>
          <FileUploadButtons />
        </div>
        <FilterBadges />
        {fileCategories.map((category) => (
          <TabsContent key={category.value} value={category.value}>
            <RenderTable />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const FileUploadDialog = ({
  open,
  onOpenChange,
  fileUpload,
  encounterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUpload: FileUploadReturn;
  encounterId: string;
}) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      aria-labelledby="file-upload-dialog"
    >
      <DialogContent
        className="mb-8 rounded-lg p-5"
        aria-describedby="file-upload"
      >
        <DialogHeader>
          <DialogTitle>{t("upload_file")}</DialogTitle>
        </DialogHeader>
        <div className="mb-1 flex items-center justify-between gap-2 rounded-md bg-secondary-300 px-4 py-2">
          <span>
            <CareIcon icon="l-paperclip" className="mr-2" />
            {fileUpload.files?.[0]?.name}
          </span>
        </div>
        <TextFormField
          name="consultation_file"
          type="text"
          label={t("enter_file_name")}
          id="upload-file-name"
          required
          value={fileUpload.fileNames[0] || ""}
          disabled={fileUpload.uploading}
          onChange={(e) => fileUpload.setFileName(e.value)}
          error={fileUpload.error || undefined}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline_primary"
            onClick={() => fileUpload.handleFileUpload(encounterId)}
            disabled={fileUpload.uploading}
            className="w-full"
            id="upload_file_button"
          >
            <CareIcon icon="l-check" className="mr-1" />
            {t("upload")}
          </Button>
          <Button
            variant="destructive"
            onClick={fileUpload.clearFiles}
            disabled={fileUpload.uploading}
          >
            <CareIcon icon="l-trash-alt" className="mr-1" />
            {t("discard")}
          </Button>
        </div>
        {!!fileUpload.progress && (
          <Progress value={fileUpload.progress} className="mt-4" />
        )}
      </DialogContent>
    </Dialog>
  );
};

const AudioPlayerDialog = ({
  open,
  onOpenChange,
  file,
  encounterId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileUploadModel | null;
  encounterId: string;
}) => {
  const { t } = useTranslation();
  const { data: fileData } = useQuery({
    queryKey: [routes.retrieveUpload, "encounter", file?.id],
    queryFn: query(routes.retrieveUpload, {
      queryParams: { file_type: "encounter", associating_id: encounterId },
      pathParams: { id: file?.id || "" },
    }),
    enabled: !!file?.id,
  });
  const { Player, stopPlayback } = AudioPlayer({
    src: fileData?.read_signed_url || "",
  });
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        stopPlayback();
        onOpenChange(false);
      }}
      aria-labelledby="audio-player-dialog"
    >
      <DialogContent
        className="mb-2 rounded-lg p-4"
        aria-describedby="audio-player"
      >
        <DialogHeader>
          <DialogTitle>{t("play_audio")}</DialogTitle>
        </DialogHeader>
        <Player />
      </DialogContent>
    </Dialog>
  );
};
