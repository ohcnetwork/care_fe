import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipComponent } from "@/components/ui/tooltip";

import ArchivedFileDialog from "@/components/Files/ArchivedFileDialog";
import { FileUploadModel } from "@/components/Patient/models";

import useFileManager from "@/hooks/useFileManager";

import { FILE_EXTENSIONS } from "@/common/constants";

import { formatName } from "@/Utils/utils";

const icons: Record<keyof typeof FILE_EXTENSIONS | "UNKNOWN", IconName> = {
  AUDIO: "l-volume",
  IMAGE: "l-image",
  PRESENTATION: "l-presentation-play",
  VIDEO: "l-video",
  UNKNOWN: "l-file-medical",
  DOCUMENT: "l-file-medical",
};

interface FileListTableProps {
  files: FileUploadModel[];
  type: "diagnostic_report" | "patient" | "encounter";
  associatingId: string;
  canEdit?: boolean;
  showHeader?: boolean;
  onRefetch?: () => void;
}

export function FileListTable({
  files,
  type,
  associatingId,
  canEdit = false,
  showHeader = true,
  onRefetch,
}: FileListTableProps) {
  const { t } = useTranslation();
  const [selectedArchivedFile, setSelectedArchivedFile] =
    useState<FileUploadModel | null>(null);
  useState<FileUploadModel | null>(null);
  const [openArchivedFileDialog, setOpenArchivedFileDialog] = useState(false);

  const fileManager = useFileManager({
    type,
    onArchive: onRefetch,
    onEdit: onRefetch,
    uploadedFiles: files
      .slice()
      .reverse()
      .map((file) => ({
        ...file,
        associating_id: associatingId,
      })),
  });

  const getFileType = (file: FileUploadModel) => {
    return fileManager.getFileType(file);
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
    return (
      <>
        <div className="flex flex-row gap-2 justify-end">
          {fileManager.isPreviewable(file) && (
            <Button
              variant="secondary"
              onClick={() => fileManager.viewFile(file, associatingId)}
              data-cy="file-view-button"
            >
              <span className="flex flex-row items-center gap-1">
                <CareIcon icon="l-eye" />
                {t("view")}
              </span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" data-cy="file-options-button">
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
                  data-cy="file-download-button"
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
                      data-cy="file-archive-option"
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
                      data-cy="file-rename-button"
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

  return (
    <>
      <div className="xl:hidden space-y-4">
        {files.length > 0 ? (
          files.map((file) => {
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
                      <div className="mt-1 text-sm text-gray-500">
                        {filetype}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">{t("date")}</div>
                      <div className="font-medium">
                        {dayjs(file.created_date).format(
                          "DD MMM YYYY, hh:mm A",
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">{t("shared_by")}</div>
                      <div className="font-medium">
                        {formatName(file.uploaded_by)}
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

      <div className="hidden xl:block">
        <Table className="border-separate border-spacing-y-3 mx-2 lg:max-w-[calc(100%-16px)]">
          {showHeader && (
            <TableHeader>
              <TableRow className="shadow-sm rounded overflow-hidden">
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
          )}
          <TableBody>
            {files.length > 0 ? (
              files.map((file) => {
                const filetype = getFileType(file);
                const fileName = file.name ? file.name + file.extension : "";

                return (
                  <TableRow
                    key={file.id}
                    data-cy={fileName}
                    className={cn("shadow-sm rounded-md overflow-hidden group")}
                  >
                    <TableCell
                      className={cn(
                        "font-medium rounded-l-md rounded-y-md group-hover:bg-transparent",
                        file.is_archived ? "bg-white/50" : "bg-white",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-full bg-gray-100 shrink-0">
                          <CareIcon
                            icon={icons[filetype]}
                            className="text-xl"
                          />
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
                      {formatName(file.uploaded_by)}
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

      <ArchivedFileDialog
        open={openArchivedFileDialog}
        onOpenChange={setOpenArchivedFileDialog}
        file={selectedArchivedFile}
      />
      {fileManager.Dialogues}
    </>
  );
}
