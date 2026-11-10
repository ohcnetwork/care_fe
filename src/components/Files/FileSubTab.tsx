import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Archive,
  Download,
  EllipsisVertical,
  Eye,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  LucideIcon,
  Pencil,
  Play,
  Presentation,
  SearchIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipComponent } from "@/components/ui/tooltip";

import Pagination from "@/components/Common/Pagination";
import { ArchivedBadge } from "@/components/Files/ArchivedBadge";
import ArchivedFileDialog from "@/components/Files/ArchivedFileDialog";
import AudioPlayerDialog from "@/components/Files/AudioPlayerDialog";
import { ArchiveStatusFilter } from "@/components/Files/FileFilters";
import FileUploadDialog from "@/components/Files/FileUploadDialog";
import FileUploadDropdown from "@/components/Files/FileUploadDropdown";

import useFileManager from "@/hooks/useFileManager";
import useFileUpload from "@/hooks/useFileUpload";
import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import {
  BACKEND_ALLOWED_EXTENSIONS,
  FILE_EXTENSIONS,
  FileReadMinimal,
  FileType,
} from "@/types/files/file";
import fileApi from "@/types/files/fileApi";

interface FilesTabProps {
  type: FileType.ENCOUNTER | FileType.PATIENT;
  encounter?: EncounterRead;
  patient?: PatientRead;
  associatingId: string;
  canEdit: boolean | undefined;
}

const FILE_TYPE_ICONS: Record<
  keyof typeof FILE_EXTENSIONS | "UNKNOWN",
  LucideIcon
> = {
  AUDIO: FileAudio,
  IMAGE: FileImage,
  PRESENTATION: Presentation,
  VIDEO: FileVideo,
  DOCUMENT: FileText,
  UNKNOWN: FileText,
};

const PAGE_SIZE = 15;

export const FilesPage = ({
  type,
  associatingId,
  patient,
  encounter,
  canEdit,
}: FilesTabProps) => {
  const { t } = useTranslation();
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openArchivedFileDialog, setOpenArchivedFileDialog] = useState(false);
  const [selectedArchivedFile, setSelectedArchivedFile] =
    useState<FileReadMinimal | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] =
    useState<FileReadMinimal | null>(null);
  const [openAudioPlayerDialog, setOpenAudioPlayerDialog] = useState(false);
  const { hasPermission } = usePermissions();
  const { qParams, updateQuery, updatePage } = useFilters({
    limit: PAGE_SIZE,
    disableCache: true,
  });
  const page = Number(qParams.page) || 1;

  const { canViewClinicalData } = getPermissions(
    hasPermission,
    patient?.permissions ?? [],
  );
  const { canReadEncounterClinicalData, canReadEncounter } = getPermissions(
    hasPermission,
    encounter?.permissions ?? [],
  );
  const canAccess =
    type === "encounter"
      ? canReadEncounterClinicalData || canReadEncounter
      : canViewClinicalData;

  const queryParams = {
    file_type: type,
    associating_id: associatingId,
    name: qParams.name || undefined,
    is_archived: qParams.is_archived,
    ordering: "-created_date",
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ["files", type, associatingId, queryParams],
    queryFn: query.debounced(fileApi.list, { queryParams }),
    enabled: canAccess,
    placeholderData: keepPreviousData,
  });

  const fileManager = useFileManager({
    type: type,
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
    allowedExtensions: BACKEND_ALLOWED_EXTENSIONS,
    allowNameFallback: false,
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

  const isFiltered = !!qParams.name || qParams.is_archived !== undefined;
  const totalCount = files?.count ?? 0;

  return (
    <>
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

      <Frame spacing="sm" className="min-w-0">
        <FrameHeader className="flex-row flex-wrap items-center gap-2">
          <InputGroup className="min-w-0 flex-1 bg-background sm:max-w-xs">
            <InputGroupInput
              id="search-by-filename"
              name="name"
              aria-label={t("search_files")}
              placeholder={t("search_files")}
              value={qParams.name || ""}
              onChange={(e) => updateQuery({ name: e.target.value })}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          <ArchiveStatusFilter
            value={qParams.is_archived}
            onChange={(is_archived) => updateQuery({ is_archived })}
          />
          {canEdit && (
            <div className="ml-auto">
              <FileUploadDropdown fileUpload={fileUpload} />
            </div>
          )}
        </FrameHeader>

        <FramePanel className="min-w-0 overflow-hidden p-0 **:data-[slot=table-container]:rounded-none **:data-[slot=table-container]:border-0">
          {filesLoading ? (
            <div
              className="space-y-2 p-3"
              role="status"
              aria-label={t("loading")}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : !files?.results.length ? (
            <Empty className="p-6 sm:p-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderOpen />
                </EmptyMedia>
                <EmptyTitle>{t("no_files_found", { type: "" })}</EmptyTitle>
                <EmptyDescription>
                  {t(
                    isFiltered
                      ? "try_adjusting_your_filters_or_search"
                      : "no_files_found_description",
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t("file_name")}</TableHead>
                  <TableHead className="hidden w-[14%] px-4 md:table-cell">
                    {t("file_type")}
                  </TableHead>
                  <TableHead className="hidden w-[20%] px-4 lg:table-cell">
                    {t("shared_by")}
                  </TableHead>
                  <TableHead className="hidden w-[14%] px-4 md:table-cell">
                    {t("date")}
                  </TableHead>
                  <TableHead className="w-40 pr-4 text-right">
                    <span className="sr-only">{t("actions")}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.results.map((file) => {
                  const fileType = fileManager.getFileType(file);
                  const Icon = FILE_TYPE_ICONS[fileType];
                  const fileName = file.name ? file.name + file.extension : "";
                  const uploadedBy = file.uploaded_by
                    ? formatName(file.uploaded_by)
                    : "";

                  return (
                    <TableRow
                      key={file.id}
                      className={cn(
                        "hover:bg-muted/40",
                        file.is_archived && "bg-muted/30",
                      )}
                    >
                      <TableCell className="py-3 pl-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground",
                              file.is_archived && "opacity-60",
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={cn(
                                  "truncate font-medium",
                                  file.is_archived
                                    ? "text-muted-foreground"
                                    : "text-foreground",
                                )}
                                title={fileName}
                              >
                                {fileName}
                              </span>
                              {file.is_archived && (
                                <ArchivedBadge
                                  reason={file.archive_reason}
                                  archivedBy={file.archived_by}
                                  archivedAt={file.archived_datetime}
                                />
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground md:hidden">
                              {[
                                t(`file_type__${fileType.toLowerCase()}`),
                                formatDateTime(
                                  file.created_date,
                                  "DD MMM YYYY",
                                ),
                              ].join(" · ")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden px-4 text-muted-foreground md:table-cell">
                        {t(`file_type__${fileType.toLowerCase()}`)}
                      </TableCell>
                      <TableCell className="hidden truncate px-4 text-muted-foreground lg:table-cell">
                        {uploadedBy}
                      </TableCell>
                      <TableCell className="hidden px-4 text-muted-foreground md:table-cell">
                        <TooltipComponent
                          content={formatDateTime(
                            file.created_date,
                            "DD MMM YYYY, hh:mm A",
                          )}
                        >
                          <span>
                            {formatDateTime(file.created_date, "DD MMM YYYY")}
                          </span>
                        </TooltipComponent>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <FileRowActions
                          file={file}
                          canEdit={canEdit}
                          isAudio={fileType === "AUDIO"}
                          isPreviewable={fileManager.isPreviewable(file)}
                          onPlay={() => {
                            setSelectedAudioFile(file);
                            setOpenAudioPlayerDialog(true);
                          }}
                          onView={() =>
                            fileManager.viewFile(file, associatingId)
                          }
                          onViewArchived={() => {
                            setSelectedArchivedFile(file);
                            setOpenArchivedFileDialog(true);
                          }}
                          onDownload={() =>
                            fileManager.downloadFile(file, associatingId)
                          }
                          onRename={() =>
                            fileManager.editFile(file, associatingId)
                          }
                          onArchive={() =>
                            fileManager.archiveFile(file, associatingId)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </FramePanel>

        {totalCount > 0 && (
          <FrameFooter className="flex-row flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t("files_result_range", {
                start: (page - 1) * PAGE_SIZE + 1,
                end: Math.min(page * PAGE_SIZE, totalCount),
                total: totalCount,
              })}
            </p>
            {totalCount > PAGE_SIZE && (
              <Pagination
                data={{ totalCount }}
                cPage={page}
                defaultPerPage={PAGE_SIZE}
                onChange={(page) => updatePage(page)}
                className=""
              />
            )}
          </FrameFooter>
        )}
      </Frame>
    </>
  );
};

interface FileRowActionsProps {
  file: FileReadMinimal;
  canEdit: boolean | undefined;
  isAudio: boolean;
  isPreviewable: boolean;
  onPlay: () => void;
  onView: () => void;
  onViewArchived: () => void;
  onDownload: () => void;
  onRename: () => void;
  onArchive: () => void;
}

function FileRowActions({
  file,
  canEdit,
  isAudio,
  isPreviewable,
  onPlay,
  onView,
  onViewArchived,
  onDownload,
  onRename,
  onArchive,
}: FileRowActionsProps) {
  const { t } = useTranslation();

  if (file.is_archived) {
    // Keep the View button in the same slot as on active rows: archived
    // entries have no menu, so reserve the space the menu trigger takes.
    return (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="outline" size="sm" onClick={onViewArchived}>
          <Eye />
          {t("view")}
        </Button>
        <span aria-hidden className="size-9 shrink-0" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {isAudio && (
        <Button variant="outline" size="sm" onClick={onPlay}>
          <Play />
          {t("play")}
        </Button>
      )}
      {isPreviewable && (
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye />
          {t("view")}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("more_actions")}>
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onSelect={onDownload}>
            <Download />
            {t("download")}
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuItem onSelect={onRename}>
                <Pencil />
                {t("rename")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onArchive}>
                <Archive />
                {t("archive")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
