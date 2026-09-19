import { CheckCircle2, FileText, Printer } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { FileListTable } from "@/components/Files/FileListTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
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
      <Card className="shadow-none rounded-lg border-gray-200 bg-gray-50">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold">
            {report.code?.display}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {observations.length === 0 && (
            <p className="text-gray-800 whitespace-pre-wrap p-2 rounded-lg bg-white border cursor-default text-center">
              {t("no_observations_entered")}
            </p>
          )}
          <DiagnosticReportResultsTable observations={observations} />
        </CardContent>
      </Card>

      <Card className="shadow-none rounded-lg border-gray-200 bg-gray-50">
        <CardContent className="p-4 space-y-2">
          <Label
            htmlFor={`review-conclusion-${report.id}`}
            className="font-medium"
          >
            {t("conclusion")}
          </Label>
          {isFinal ? (
            <p className="text-gray-800 whitespace-pre-wrap p-2 rounded-lg bg-white border border-gray-200 cursor-default">
              {report.conclusion || t("no_conclusion_entered")}
            </p>
          ) : (
            <Textarea
              id={`review-conclusion-${report.id}`}
              className="w-full field-sizing-content focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-lg disabled:cursor-not-allowed"
              placeholder={t("enter_conclusion")}
              value={conclusion}
              onChange={(event) => onConclusionChange(event.target.value)}
              disabled={disableEdit}
            />
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card className="shadow-none rounded-lg border-gray-200 bg-gray-50">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-base font-medium">
              {t("uploaded_files")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <FileListTable
              files={files}
              type="diagnostic_report"
              associatingId={report.id}
              canEdit={!disableEdit && !isFinal}
              showHeader={false}
            />
          </CardContent>
        </Card>
      )}

      {isFinal && (
        <div className="flex gap-2 justify-end">
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

      {report.status === DiagnosticReportStatus.preliminary && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            disabled={!canApprove}
            className="gap-2"
            onClick={() => setShowApproveDialog(true)}
          >
            <CheckCircle2 className="size-4" />
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
    </div>
  );
}
