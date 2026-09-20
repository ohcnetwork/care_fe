import { Camera, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DottedDivider } from "@/components/careui/dotted-divider";
import { FileListTable } from "@/components/Files/FileListTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  return (
    <>
      {files?.results && files.results.length > 0 && (
        <div className="mt-3">
          <div className="text-lg font-medium">{t("uploaded_files")}</div>
          <FileListTable
            files={files.results}
            type="diagnostic_report"
            associatingId={reportId}
            canEdit={!isReadOnly}
            showHeader={false}
          />
        </div>
      )}

      {isPreliminary && (
        <div className="space-y-5">
          <DottedDivider className=" text-gray-500" />
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-5 shadow-sm mt-2">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-base font-semibold text-gray-950">
                {t("attach_result_files")}
              </h3>
              <p className="mt-1.5 text-sm text-gray-600">
                {t("add_supporting_photos_or_documents", {
                  formats:
                    BACKEND_ALLOWED_EXTENSIONS.slice(0, 5)
                      .join(", ")
                      .toUpperCase() + `, ${t("etc")}`,
                })}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 w-full sm:items-center sm:justify-center">
                <Button
                  variant="outline"
                  className=" border-gray-300 bg-white font-semibold text-gray-950 shadow-sm hover:bg-white"
                  disabled={isReadOnly}
                  onClick={() => fileUpload.handleCameraCapture()}
                >
                  <Camera className="size-4" />
                  {t("take_photo")}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className={cn(
                    "border-gray-300 bg-white font-semibold text-gray-950 shadow-sm hover:bg-white",
                    isReadOnly
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer",
                  )}
                >
                  <Label htmlFor={isReadOnly ? undefined : inputId}>
                    <Upload className="size-4" />
                    {t("upload_files")}
                  </Label>
                </Button>
                <fileUpload.Input className="hidden" disabled={isReadOnly} />
              </div>

              {fileUpload.files.length > 0 && (
                <div className="mt-5 w-full max-w-md space-y-2">
                  <div
                    className="truncate text-sm text-gray-600"
                    title={fileUpload.files.map((file) => file.name).join(", ")}
                  >
                    {fileUpload.files.map((file) => file.name).join(", ")}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-300 bg-white"
                    disabled={isReadOnly}
                    onClick={() => fileUpload.clearFiles()}
                  >
                    {t("clear")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
