import { Link } from "@tanstack/react-router";
import { Check, FileText, Printer } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { RichTextEditor } from "@/components/Common/RichTextEditor";
import { FileListTable } from "@/components/Files/FileListTable";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Markdown } from "@/components/ui/markdown";
import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
import { DiagnosticReportTimestamps } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportTimestamps";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import { ObservationRead } from "@/types/emr/observation/observation";
import { FileReadMinimal } from "@/types/files/file";

interface DiagnosticReportReviewContentProps {
  report: DiagnosticReportRead;
  observations: ObservationRead[];
  files: FileReadMinimal[];
  facilityId: string;
  patientId: string;
  conclusion: string;
  onConclusionChange: (conclusion: string) => void;
  disableEdit: boolean;
  canApprove: boolean;
  onApprove: () => void;
}

export function DiagnosticReportReviewContent({
  report,
  observations,
  files,
  facilityId,
  patientId,
  conclusion,
  onConclusionChange,
  disableEdit,
  canApprove,
  onApprove,
}: DiagnosticReportReviewContentProps) {
  const { t } = useTranslation();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const isFinal = report.status === DiagnosticReportStatus.final;
  const displayedConclusion = isFinal ? report.conclusion || "" : conclusion;

  return (
    <div className="space-y-3">
      {observations.length === 0 && (
        <EmptyState
          title={t("no_observations_entered")}
          className="rounded-md shadow-none"
        />
      )}
      <DiagnosticReportResultsTable observations={observations} />

      {(!isFinal || displayedConclusion) && (
        <div className="space-y-1.5 rounded-lg border border-border bg-background px-3 py-2.5">
          <h6 className="text-sm font-medium text-foreground">
            {t("conclusion")}
          </h6>
          {isFinal ? (
            <Markdown
              richText
              content={displayedConclusion}
              className="prose-sm wrap-anywhere [&>:first-child]:mt-0 [&>:last-child]:mb-0"
            />
          ) : (
            <RichTextEditor
              label={t("conclusion")}
              placeholder={t("enter_conclusion_of_diagnostic_report")}
              value={conclusion}
              onChange={onConclusionChange}
              disabled={disableEdit}
            />
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border bg-background px-3 py-2.5">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium text-foreground">
              {t("uploaded_files")}
            </h5>
            <Badge variant="secondary">{files.length}</Badge>
          </div>
          <FileListTable
            files={files}
            type="diagnostic_report"
            associatingId={report.id}
            canEdit={!disableEdit && !isFinal}
          />
        </div>
      )}

      <div className="-mx-4 flex flex-col-reverse justify-between gap-3 border-t border-border bg-background/50 px-4 py-2 sm:-mx-5 sm:flex-row sm:items-center sm:px-5">
        <div className="flex justify-start">
          <DiagnosticReportTimestamps report={report} />
        </div>

        {report.status === DiagnosticReportStatus.preliminary && (
          <div className="flex justify-end items-center gap-2">
            <Button
              variant="primary"
              disabled={!canApprove}
              className="gap-2"
              onClick={() => setShowApproveDialog(true)}
            >
              <Check className="size-4" />
              {t("approve_results")}
            </Button>
            <ConfirmActionDialog
              open={showApproveDialog}
              onOpenChange={setShowApproveDialog}
              title={t("confirm")}
              description={t("are_you_sure_want_to_approve_diagnostic_report")}
              confirmText={t("approve")}
              onConfirm={onApprove}
              disabled={!canApprove}
            />
          </div>
        )}

        {isFinal && (
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button variant="outline" className="gap-2" asChild>
              <Link
                to="/facility/$facilityId/patient/$patientId/diagnostic_reports/$diagnosticReportId/print"
                params={{
                  facilityId,
                  patientId,
                  diagnosticReportId: report.id,
                }}
                className="flex items-center gap-2"
              >
                <Printer className="size-4" />
                {t("print_report")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                to="/facility/$facilityId/patient/$patientId/diagnostic_reports/$diagnosticReportId"
                params={{
                  facilityId,
                  patientId,
                  diagnosticReportId: report.id,
                }}
                className="flex items-center gap-2"
              >
                <FileText className="size-4" />
                {t("view_report")}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
