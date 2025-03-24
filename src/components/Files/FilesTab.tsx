import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { t } from "i18next";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipComponent } from "@/components/ui/tooltip";

import Loading from "@/components/Common/Loading";
import ArchivedFileDialog from "@/components/Files/ArchivedFileDialog";
import AudioPlayerDialog from "@/components/Files/AudioPlayerDialog";
import FileUploadDialog from "@/components/Files/FileUploadDialog";
import { FileUploadModel } from "@/components/Patient/models";

import useFileManager from "@/hooks/useFileManager";
import useFileUpload from "@/hooks/useFileUpload";
import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";
import { FILE_EXTENSIONS } from "@/common/constants";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import { usePermissions } from "@/context/PermissionContext";
import { Encounter, inactiveEncounterStatus } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";

export interface FilesTabProps {
  type: "encounter" | "patient";
  encounter?: Encounter;
  patient?: Patient;
}

export const FilesTab = (props: FilesTabProps) => {
  const { patient, type, encounter } = props;
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
  });
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openArchivedFileDialog, setOpenArchivedFileDialog] = useState(false);
  const [selectedArchivedFile, setSelectedArchivedFile] =
    useState<FileUploadModel | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] =
    useState<FileUploadModel | null>(null);
  const [openAudioPlayerDialog, setOpenAudioPlayerDialog] = useState(false);
  const { hasPermission } = usePermissions();
  const {
    canViewClinicalData,
    canViewEncounter,
    canWritePatient,
    canWriteEncounter,
  } = getPermissions(
    hasPermission,
    encounter?.permissions ?? patient?.permissions ?? [],
  );
  const canAccess =
    type === "encounter"
      ? canViewClinicalData || canViewEncounter
      : canViewClinicalData;

  const canWriteCurrentEncounter =
    canWriteEncounter &&
    encounter &&
    !inactiveEncounterStatus.includes(encounter.status);

  const canEdit =
    type === "encounter" ? canWriteCurrentEncounter : canWritePatient;

  const queryClient = useQueryClient();

  const associatingId =
    {
      patient: patient?.id,
      encounter: encounter?.id,
    }[type] || "";

  const fileCategories = [
    { value: "all", label: "All" },
    { value: "audio", label: "Audio" },
    { value: "xray", label: "X-Ray" },
    { value: "identity_proof", label: "Identity Proof" },
    { value: "unspecified", label: "Unspecified" },
    { value: "discharge_summary", label: "Discharge Summary" },
  ] as const;

  const { mutate: generateDischargeSummary, isPending: isGenerating } =
    useMutation<{ detail: string }, HTTPError>({
      mutationFn: mutate(routes.encounter.generateDischargeSummary, {
        pathParams: { encounterId: encounter?.id || "" },
      }),
      onSuccess: (response) => {
        toast.success(response.detail);
        refetch();
      },
    });

  const {
    data: files,
    isLoading: filesLoading,
    refetch,
  } = useQuery({
    queryKey: ["files", type, associatingId, qParams],
    queryFn: query(routes.viewUpload, {
      queryParams: {
        file_type: type,
        associating_id: associatingId,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        ...(qParams.is_archived !== undefined && {
          is_archived: qParams.is_archived,
        }),
        ...(qParams.file !== "all" && {
          file_category: qParams.file,
        }),
      },
    }),
    enabled: canAccess,
  });

  const fileManager = useFileManager({
    type: type,
    onArchive: refetch,
    onEdit: refetch,
    uploadedFiles:
      files?.results
        .filter((file) => !file.is_archived)
        .slice()
        .reverse()
        .map((file) => ({
          ...file,
          associating_id: associatingId,
        })) || [],
  });

  const fileUpload = useFileUpload({
    type: type,
    multiple: true,
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
    onUpload: () => {
      refetch();
    },
    compress: false,
  });

  useEffect(() => {
    if (
      fileUpload.files.length > 0 &&
      fileUpload.files[0] !== undefined &&
      !fileUpload.previewing
    ) {
      setOpenUploadDialog(true);
    } else {
      setOpenUploadDialog(false);
    }
  }, [fileUpload.files, fileUpload.previewing]);

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

  const getArchivedMessage = (file: FileUploadModel) => {
    return (
      <div className="flex flex-row gap-2 justify-end">
        <span className="text-gray-200/90 self-center uppercase font-bold">
          {t("archived")}
        </span>
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedArchivedFile(file);
            setOpenArchivedFileDialog(true);
          }}
        >
          <span className="flex flex-row items-center gap-1">
            <CareIcon icon="l-archive-alt" />
            {t("view")}
          </span>
        </Button>
      </div>
    );
  };

  const DetailButtons = ({ file }: { file: FileUploadModel }) => {
    const filetype = getFileType(file);
    return (
      <>
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
              onClick={() => fileManager.viewFile(file, associatingId)}
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild className="text-primary-900">
                <Button
                  size="sm"
                  onClick={() => fileManager.downloadFile(file, associatingId)}
                  variant="ghost"
                  className="w-full flex flex-row justify-stretch items-center"
                >
                  <CareIcon icon="l-arrow-circle-down" className="mr-1" />
                  <span>{t("download")}</span>
                </Button>
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem asChild className="text-primary-900">
                    <Button
                      size="sm"
                      onClick={() =>
                        fileManager.archiveFile(file, associatingId)
                      }
                      variant="ghost"
                      className="w-full flex flex-row justify-stretch items-center"
                    >
                      <CareIcon icon="l-archive-alt" className="mr-1" />
                      <span>{t("archive")}</span>
                    </Button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-primary-900">
                    <Button
                      size="sm"
                      onClick={() => fileManager.editFile(file, associatingId)}
                      variant="ghost"
                      className="w-full flex flex-row justify-stretch items-center"
                    >
                      <CareIcon icon="l-pen" className="mr-1" />
                      <span>{t("rename")}</span>
                    </Button>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </>
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
      <div className="flex flex-row gap-2 mt-2 mx-2">
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
    if (!canEdit) return <></>;
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
            <Label
              htmlFor={`file_upload_${type}`}
              className="py-1 flex flex-row items-center cursor-pointer text-primary-900  w-full"
            >
              <CareIcon icon="l-file-upload-alt" className="mr-1" />
              <span>{t("choose_file")}</span>
            </Label>
            {fileUpload.Input({ className: "hidden" })}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileUpload.handleCameraCapture()}
              className="flex flex-row justify-stretch items-center w-full text-primary-900"
            >
              <CareIcon icon="l-camera" />
              <span>{t("open_camera")}</span>
            </Button>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileUpload.handleAudioCapture()}
              className="flex flex-row justify-stretch items-center w-full text-primary-900"
            >
              <CareIcon icon="l-microphone" />
              <span>{t("record")}</span>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const RenderCard = () => (
    <div className="xl:hidden space-y-4 px-2">
      {files?.results && files?.results?.length > 0 ? (
        files.results.map((file) => {
          const filetype = getFileType(file);
          const fileName = file.name ? file.name + file.extension : "";

          return (
            <Card
              key={file.id}
              className={cn(
                "overflow-hidden",
                file.is_archived ? "bg-white/50" : "bg-white",
              )}
            >
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-full bg-gray-100 shrink-0">
                    <CareIcon icon={icons[filetype]} className="text-xl" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">
                      {fileName}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">{filetype}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">{t("date")}</div>
                    <div className="font-medium">
                      {dayjs(file.created_date).format("DD MMM YYYY, hh:mm A")}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t("shared_by")}</div>
                    <div className="font-medium">
                      {file.uploaded_by?.username}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  {file.is_archived ? (
                    getArchivedMessage(file)
                  ) : (
                    <DetailButtons file={file} />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div className="text-center py-4 text-gray-500">
          {t("no_files_found")}
        </div>
      )}
    </div>
  );

  const RenderTable = () => (
    <div className="hidden xl:block">
      <Table className="border-separate border-spacing-y-3 mx-2 lg:max-w-[calc(100%-16px)]">
        <TableHeader>
          <TableRow className="shadow rounded overflow-hidden">
            <TableHead className="w-[20%] bg-white rounded-l">
              {t("file_name")}
            </TableHead>
            <TableHead className="w-[20%] rounded-y bg-white">
              {t("file_type")}
            </TableHead>
            <TableHead className="w-[25%] rounded-y bg-white">
              {t("date")}
            </TableHead>
            <TableHead className="w-[20%] rounded-y bg-white">
              {t("shared_by")}
            </TableHead>
            <TableHead className="w-[15%] text-right rounded-r bg-white"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files?.results && files?.results?.length > 0 ? (
            files.results.map((file) => {
              const filetype = getFileType(file);
              const fileName = file.name ? file.name + file.extension : "";

              return (
                <TableRow
                  key={file.id}
                  className={cn("shadow rounded-md overflow-hidden group")}
                >
                  <TableCell
                    className={cn(
                      "font-medium rounded-l-md rounded-y-md group-hover:bg-transparent",
                      file.is_archived ? "bg-white/50" : "bg-white",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-full bg-gray-100 shrink-0">
                        <CareIcon icon={icons[filetype]} className="text-xl" />
                      </span>
                      {file.name && file.name.length > 20 ? (
                        <TooltipComponent content={fileName}>
                          <span className="text-gray-900 truncate block">
                            {fileName}
                          </span>
                        </TooltipComponent>
                      ) : (
                        <span className="text-gray-900 truncate block">
                          {fileName}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "rounded-y-md group-hover:bg-transparent",
                      file.is_archived ? "bg-white/50" : "bg-white",
                    )}
                  >
                    {filetype}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "rounded-y-md group-hover:bg-transparent",
                      file.is_archived ? "bg-white/50" : "bg-white",
                    )}
                  >
                    <TooltipComponent
                      content={dayjs(file.created_date).format(
                        "DD MMM YYYY, hh:mm A",
                      )}
                    >
                      <span>
                        {dayjs(file.created_date).format("DD MMM YYYY ")}
                      </span>
                    </TooltipComponent>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "rounded-y-md group-hover:bg-transparent",
                      file.is_archived ? "bg-white/50" : "bg-white",
                    )}
                  >
                    {file.uploaded_by?.username}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right rounded-r-md rounded-y-md group-hover:bg-transparent",
                      file.is_archived ? "bg-white/50" : "bg-white",
                    )}
                  >
                    {file.is_archived ? (
                      getArchivedMessage(file)
                    ) : (
                      <DetailButtons file={file} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                {t("no_files_found")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
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
          type={type}
          associatingId={associatingId}
        />
      </div>
      <ArchivedFileDialog
        open={openArchivedFileDialog}
        onOpenChange={setOpenArchivedFileDialog}
        file={selectedArchivedFile}
      />
      <FileUploadDialog
        open={openUploadDialog}
        onOpenChange={setOpenUploadDialog}
        fileUpload={fileUpload}
        associatingId={associatingId}
        type={type}
      />
      <Tabs
        value={qParams.file || "all"}
        onValueChange={(value) =>
          updateQuery({
            file: value,
            is_archived: undefined,
            page: undefined,
          })
        }
      >
        {type === "encounter" && (
          <TabsList className="bg-gray-200 py-0 w-fit">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
            >
              {t("all")}
            </TabsTrigger>
            <TabsTrigger
              value="discharge_summary"
              className="data-[state=active]:bg-white rounded-md px-4 font-semibold"
            >
              {t("discharge_summary")}
            </TabsTrigger>
          </TabsList>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 mt-2">
          <FilterButton />
          {type === "encounter" && qParams.file === "discharge_summary" && (
            <>
              <Button
                variant="outline_primary"
                className="flex flex-row items-center"
                onClick={async () => {
                  await queryClient.invalidateQueries({
                    queryKey: ["files"],
                  });
                  toast.success(t("refreshed"));
                }}
              >
                <CareIcon icon="l-sync" />
                <span className="ml-2">{t("refresh")}</span>
              </Button>
              <Button
                variant="primary"
                className="flex flex-row items-center"
                onClick={() => generateDischargeSummary()}
                disabled={isGenerating}
              >
                <CareIcon icon="l-file-medical" className="hidden sm:block" />
                <span>
                  {isGenerating
                    ? t("generating")
                    : t("generate_discharge_summary")}
                </span>
              </Button>
            </>
          )}
          <FileUploadButtons />
        </div>
        <FilterBadges />
        {fileCategories.map((category) => (
          <TabsContent key={category.value} value={category.value}>
            <RenderTable />
            <RenderCard />
          </TabsContent>
        ))}
      </Tabs>
      <Pagination totalCount={files?.count || 0} />
    </div>
  );
};
