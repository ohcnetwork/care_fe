import { FileCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

import { type SavedReportSignal } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportForm";
import { DiagnosticReportHeader } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportHeader";
import { DiagnosticReportReviewContent } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportReviewContent";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import { ObservationDefinitionRead } from "@/types/emr/observationDefinition/observationDefinition";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { useDiagnosticReportReview } from "./useDiagnosticReportReview";

interface DiagnosticReportReviewProps {
  facilityId: string;
  patientId: string;
  diagnosticReports: DiagnosticReportRead[];
  observationDefinitions: ObservationDefinitionRead[];
  serviceRequestId: string;
  disableEdit: boolean;
  expandedReport: SavedReportSignal | null;
}

export function DiagnosticReportReview({
  diagnosticReports,
  ...props
}: DiagnosticReportReviewProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h5 className="text-gray-950 font-semibold">
        {diagnosticReports.some(
          (report) => report.status !== DiagnosticReportStatus.final,
        )
          ? t("review_test_results")
          : t("diagnostic_report", { count: diagnosticReports.length })}
      </h5>

      {diagnosticReports.map((report) => (
        <DiagnosticReportReviewItem
          key={report.id}
          report={report}
          {...props}
        />
      ))}
    </div>
  );
}

interface DiagnosticReportReviewItemProps extends Omit<
  DiagnosticReportReviewProps,
  "diagnosticReports"
> {
  report: DiagnosticReportRead;
}

function DiagnosticReportReviewItem({
  report,
  facilityId,
  patientId,
  serviceRequestId,
  disableEdit,
  expandedReport,
}: DiagnosticReportReviewItemProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastExpandedReport, setLastExpandedReport] =
    useState<SavedReportSignal | null>(null);

  if (expandedReport !== lastExpandedReport) {
    setLastExpandedReport(expandedReport);
    if (expandedReport?.id === report.id) {
      setIsExpanded(true);
    }
  }

  const {
    fullReport,
    isLoadingReport,
    isReportError,
    refetchReport,
    files,
    isUpdatingReport,
    conclusion,
    onConclusionChange,
    observations,
    canApprove,
    onApprove,
  } = useDiagnosticReportReview({
    report,
    facilityId,
    patientId,
    serviceRequestId,
    disableEdit,
    isExpanded,
  });
  const currentReport = fullReport ?? report;

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <DiagnosticReportHeader
          report={currentReport}
          title={
            currentReport.code?.display ?? currentReport.service_request?.title
          }
          updatedBy={currentReport.updated_by}
          icon={FileCheck}
          isExpanded={isExpanded}
        />
        <CollapsibleContent>
          <CardContent className="px-2 pb-0">
            {isLoadingReport ? (
              <TableSkeleton count={4} />
            ) : isReportError || !fullReport ? (
              <div className="space-y-2 p-4" role="alert">
                <p>{t("something_went_wrong")}</p>
                <Button variant="outline" onClick={() => refetchReport()}>
                  {t("try_again")}
                </Button>
              </div>
            ) : (
              <DiagnosticReportReviewContent
                report={fullReport}
                observations={observations}
                files={files}
                facilityId={facilityId}
                patientId={patientId}
                conclusion={conclusion}
                onConclusionChange={onConclusionChange}
                disableEdit={disableEdit || isUpdatingReport}
                canApprove={canApprove}
                onApprove={onApprove}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
