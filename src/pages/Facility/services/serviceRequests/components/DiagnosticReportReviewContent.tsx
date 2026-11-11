import { Check, FileText, Printer } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { RichTextEditor } from "@/components/Common/RichTextEditor";
import { FileListTable } from "@/components/Files/FileListTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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

  return (
    <div className="space-y-6">
      {observations.length === 0 && (
        <EmptyState
          title={t("no_observations_entered")}
          className="rounded-md shadow-none"
        />
      )}
      <DiagnosticReportResultsTable observations={observations} />

      {(!isFinal || conclusion) && (
        <Card className="mb-4 shadow-none rounded-lg border-gray-200 bg-white">
          <CardContent className="p-2 space-y-2">
            <h6 className="font-medium text-gray-950">{t("conclusion")}</h6>
            <RichTextEditor
              label={t("conclusion")}
              placeholder={t("enter_conclusion_of_diagnostic_report")}
              value={conclusion}
              onChange={onConclusionChange}
              disabled={isFinal || disableEdit}
            />
          </CardContent>
        </Card>
      )}

      {files.length > 0 && (
        <div className="space-y-4 rounded-lg border border-gray-300 bg-gray-300/30 p-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h5 className="text-gray-950 font-semibold">
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
        </div>
      )}

      <div className="flex sm:flex-row flex-col-reverse justify-between bg-white/50 -mx-2 p-2 pt-3 border-t border-gray-300 rounded-b-lg gap-3">
        <div className="flex justify-start items-end">
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
                basePath="/"
                href={`/facility/${facilityId}/patient/${patientId}/diagnostic_reports/${report.id}/print`}
                className="flex items-center gap-2"
              >
                <Printer className="size-4" />
                {t("print_report")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link
                basePath="/"
                href={`/facility/${facilityId}/patient/${patientId}/diagnostic_reports/${report.id}`}
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
