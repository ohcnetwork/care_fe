import { Camera, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FileListTable } from "@/components/Files/FileListTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DottedDivider } from "@/components/ui/dotted-divider";
import { cn } from "@/lib/utils";
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
    <div
      className={cn(
        hasFiles && "space-y-4 rounded-lg border border-border bg-muted/30 p-2",
      )}
    >
      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h5 className="text-foreground font-semibold">
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

      {hasFiles && isPreliminary && (
        <DottedDivider className="text-muted-foreground" />
      )}

      {isPreliminary && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-background/50 p-3 border border-border rounded-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {t("result_document")}
              </h3>
              {isReadOnly && <Badge variant="outline">{t("view_only")}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("add_supporting_photos_or_documents", {
                formats:
                  BACKEND_ALLOWED_EXTENSIONS.slice(0, 5)
                    .join(", ")
                    .toUpperCase() + `, ${t("etc")}`,
              })}
            </p>

            {fileUpload.files.length > 0 && (
              <div className="mt-3 max-w-md space-y-2">
                <div
                  className="truncate text-sm text-muted-foreground"
                  title={fileUpload.files.map((file) => file.name).join(", ")}
                >
                  {fileUpload.files.map((file) => file.name).join(", ")}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border bg-background"
                  disabled={isReadOnly}
                  onClick={() => fileUpload.clearFiles()}
                >
                  {t("clear")}
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
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
        </div>
      )}
    </div>
  );
}
