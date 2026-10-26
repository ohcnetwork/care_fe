import {
  Archive,
  ArrowDownCircle,
  AudioLines,
  Dot,
  Eye,
  FileText,
  Image,
  MoreHorizontal,
  Pencil,
  Presentation,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ArchivedFileDialog from "@/components/Files/ArchivedFileDialog";

import useFileManager, { FileManagerResult } from "@/hooks/useFileManager";

import { formatName } from "@/Utils/utils";
import { FILE_EXTENSIONS, FileReadMinimal } from "@/types/files/file";
import { formatDate } from "date-fns";

const icons: Record<keyof typeof FILE_EXTENSIONS | "UNKNOWN", LucideIcon> = {
  AUDIO: AudioLines,
  IMAGE: Image,
  PRESENTATION: Presentation,
  VIDEO: Video,
  UNKNOWN: FileText,
  DOCUMENT: FileText,
};

interface FileListTableProps {
  files: FileReadMinimal[];
  type: "diagnostic_report" | "patient" | "encounter";
  associatingId: string;
  canEdit?: boolean;
}

interface FileActionProps {
  file: FileReadMinimal;
  fileManager: FileManagerResult;
  associatingId: string;
}

function ViewAction({ file, fileManager, associatingId }: FileActionProps) {
  const { t } = useTranslation();

  if (!fileManager.isPreviewable(file)) {
    return null;
  }

  return (
    <Button
      variant="link"
      className="h-auto text-foreground"
      onClick={() => fileManager.viewFile(file, associatingId)}
    >
      <span className="flex flex-row items-center gap-1 underline">
        <Eye />
        {t("view")}
      </span>
    </Button>
  );
}

function ActionsMenu({
  file,
  fileManager,
  associatingId,
  canEdit,
}: FileActionProps & { canEdit: boolean }) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("actions")}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => fileManager.downloadFile(file, associatingId)}
        >
          <ArrowDownCircle />
          {t("download")}
        </DropdownMenuItem>
        {canEdit && (
          <>
            <DropdownMenuItem
              onClick={() => fileManager.archiveFile(file, associatingId)}
            >
              <Archive />
              {t("archive")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => fileManager.editFile(file, associatingId)}
            >
              <Pencil />
              {t("rename")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FileListTable({
  files,
  type,
  associatingId,
  canEdit = false,
}: FileListTableProps) {
  const { t } = useTranslation();
  const [selectedArchivedFile, setSelectedArchivedFile] =
    useState<FileReadMinimal | null>(null);
  const [openArchivedFileDialog, setOpenArchivedFileDialog] = useState(false);

  const fileManager = useFileManager({
    type,
    uploadedFiles: files
      .slice()
      .reverse()
      .map((file) => ({
        ...file,
        associating_id: associatingId,
      })),
  });

  const getFileType = (file: FileReadMinimal) => {
    return fileManager.getFileType(file);
  };

  const getArchivedMessage = (file: FileReadMinimal) => {
    return (
      <div className="flex flex-row items-center gap-2 justify-end">
        <Button
          variant="link"
          className="h-auto"
          onClick={() => {
            setSelectedArchivedFile(file);
            setOpenArchivedFileDialog(true);
          }}
        >
          <Archive className="size-4" />
          <span className="self-center uppercase text-xs font-bold underline">
            {t("archived")}
          </span>
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {files.length > 0 ? (
        files.map((file) => {
          const filetype = getFileType(file);
          const fileName = file.name ? file.name + file.extension : "";
          const isImage = filetype === "IMAGE";
          const FileIcon = icons[filetype];

          return (
            <Card
              key={file.id}
              className="flex items-stretch overflow-hidden rounded-md"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start sm:items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xs ml-0.5",
                      isImage
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-red-100 text-red-600",
                    )}
                  >
                    <FileIcon className="size-4" strokeWidth={1.5} />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="break-all font-medium text-foreground">
                      {fileName}
                    </span>

                    <span className="flex flex-wrap items-center text-xs text-muted-foreground">
                      {formatDate(new Date(file.created_date), "dd MMM yyyy")}
                      <Dot size={9} className="mx-1 shrink-0" />
                      {formatName(file.uploaded_by)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-3 pl-12 sm:pl-0">
                  {file.is_archived ? (
                    getArchivedMessage(file)
                  ) : (
                    <ViewAction
                      file={file}
                      fileManager={fileManager}
                      associatingId={associatingId}
                    />
                  )}
                </div>
              </div>
              {!file.is_archived && (
                <div className="flex shrink-0 items-center justify-center border-l border-border bg-muted/30 px-2">
                  <ActionsMenu
                    file={file}
                    fileManager={fileManager}
                    associatingId={associatingId}
                    canEdit={canEdit}
                  />
                </div>
              )}
            </Card>
          );
        })
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          {t("no_files_found")}
        </div>
      )}

      <ArchivedFileDialog
        open={openArchivedFileDialog}
        onOpenChange={setOpenArchivedFileDialog}
        file={selectedArchivedFile}
      />
      {fileManager.Dialogues}
    </div>
  );
}
