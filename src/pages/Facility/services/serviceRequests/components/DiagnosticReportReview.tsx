import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

import { type SavedReportSignal } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportForm";
import { DiagnosticReportReviewContent } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportReviewContent";
import { DiagnosticReportReviewHeader } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportReviewHeader";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import { ObservationDefinitionRead } from "@/types/emr/observationDefinition/observationDefinition";

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
      <h2 className="text-xl font-semibold">
        {diagnosticReports.some(
          (report) => report.status !== DiagnosticReportStatus.final,
        )
          ? t("review_test_results")
          : t("diagnostic_report", { count: diagnosticReports.length })}
      </h2>

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
  observationDefinitions,
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
    isFilesFetched,
    isUpdatingReport,
    conclusion,
    onConclusionChange,
    observations,
    hasContent,
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
  const showObservationHistory =
    observationDefinitions.length > 0 || !!currentReport.observations?.length;

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <DiagnosticReportReviewHeader
          report={currentReport}
          patientId={patientId}
          isExpanded={isExpanded}
          showObservationHistory={showObservationHistory}
          isEmpty={!!fullReport && isFilesFetched && !hasContent}
        />
        <CollapsibleContent>
          <CardContent className="px-2 bg-gray-100">
            {isLoadingReport ? (
              <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
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
