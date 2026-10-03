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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ArchivedFileDialog from "@/components/Files/ArchivedFileDialog";

import useFileManager from "@/hooks/useFileManager";

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

export function FileListTable({
  files,
  type,
  associatingId,
  canEdit = false,
}: FileListTableProps) {
  const { t } = useTranslation();
  const [selectedArchivedFile, setSelectedArchivedFile] =
    useState<FileReadMinimal | null>(null);
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

  const ViewAction = ({ file }: { file: FileReadMinimal }) => {
    if (!fileManager.isPreviewable(file)) {
      return null;
    }

    return (
      <Button
        variant="link"
        className="h-auto text-gray-950"
        onClick={() => fileManager.viewFile(file, associatingId)}
      >
        <span className="flex flex-row items-center gap-1 underline">
          <Eye />
          {t("view")}
        </span>
      </Button>
    );
  };

  const ActionsMenu = ({ file }: { file: FileReadMinimal }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="actions">
            <MoreHorizontal />
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
              <ArrowDownCircle className="mr-1" />
              <span>{t("download")}</span>
            </Button>
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuItem asChild className="text-primary-900">
                <Button
                  size="sm"
                  onClick={() => fileManager.archiveFile(file, associatingId)}
                  variant="ghost"
                  className="w-full flex flex-row justify-stretch items-center"
                >
                  <Archive className="mr-1" />
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
                  <Pencil className="mr-1" />
                  <span>{t("rename")}</span>
                </Button>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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
            <div
              key={file.id}
              className="flex items-stretch overflow-hidden rounded-md border border-blue-300 bg-gray-100"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-1 sm:flex-row sm:items-center sm:justify-between bg-white rounded-sm shadow-xs m-0.5">
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
                  <div className="flex flex-col">
                    <span className="text-wrap font-medium text-gray-950">
                      {fileName}
                    </span>

                    <span className="flex items-center text-xs text-gray-700">
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
                    <ViewAction file={file} />
                  )}
                </div>
              </div>
              {!file.is_archived && (
                <div className="flex shrink-0 items-center justify-center px-2">
                  <ActionsMenu file={file} />
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center py-4 text-gray-500">
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
