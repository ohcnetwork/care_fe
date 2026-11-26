import { Camera, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FileListTable } from "@/components/Files/FileListTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BACKEND_ALLOWED_EXTENSIONS } from "@/types/files/file";

import { DiagnosticReportAttachmentState } from "./useDiagnosticReportAttachments";

interface DiagnosticReportAttachmentsProps {
  reportId: string;
  attachments: DiagnosticReportAttachmentState;
  isPreliminary: boolean;
  isReadOnly: boolean;
}

export function DiagnosticReportAttachments({
  reportId,
  attachments,
  isPreliminary,
  isReadOnly,
}: DiagnosticReportAttachmentsProps) {
  const { t } = useTranslation();
  const { files, fileUpload, inputId } = attachments;
  const fileResults = files?.results ?? [];
  const hasFiles = fileResults.length > 0;

  if (!hasFiles && !isPreliminary) {
    return null;
  }

  return (
    <div className="space-y-2 border-t border-border pt-2">
      {hasFiles && (
        <div className="space-y-2 rounded-lg border border-border bg-background px-3 py-2.5">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium text-foreground">
              {t("uploaded_files")}
            </h5>
            <Badge variant="secondary">{fileResults.length}</Badge>
          </div>
          <FileListTable
            files={fileResults}
            type="diagnostic_report"
            associatingId={reportId}
            canEdit={!isReadOnly}
          />
        </div>
      )}

      {isPreliminary && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-sm font-medium text-foreground">
            {t("result_document")}
          </h3>
          {isReadOnly && <Badge variant="outline">{t("view_only")}</Badge>}
          <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground md:block">
            {t("add_supporting_photos_or_documents", {
              formats:
                BACKEND_ALLOWED_EXTENSIONS.slice(0, 5)
                  .join(", ")
                  .toUpperCase() + `, ${t("etc")}`,
            })}
          </p>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              disabled={isReadOnly}
              onClick={() => fileUpload.handleCameraCapture()}
            >
              <Camera className="size-4" />
              {t("take_photo")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isReadOnly}
              onClick={() => document.getElementById(inputId)?.click()}
            >
              <Upload className="size-4" />
              {t("upload_files")}
            </Button>
            <fileUpload.Input className="hidden" disabled={isReadOnly} />
          </div>
          {fileUpload.files.length > 0 && (
            <div className="flex w-full min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <span
                className="min-w-0 truncate"
                title={fileUpload.files.map((file) => file.name).join(", ")}
              >
                {fileUpload.files.map((file) => file.name).join(", ")}
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={isReadOnly}
                onClick={() => fileUpload.clearFiles()}
              >
                {t("clear")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
