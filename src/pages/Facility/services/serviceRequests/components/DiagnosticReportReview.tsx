import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { type SavedReportSignal } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportForm";
import { DiagnosticReportReviewContent } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportReviewContent";
import { DiagnosticReportReviewHeader } from "@/pages/Facility/services/serviceRequests/components/DiagnosticReportReviewHeader";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { ObservationDefinitionRead } from "@/types/emr/observationDefinition/observationDefinition";
import fileApi from "@/types/files/fileApi";

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
      {diagnosticReports.some(
        (report) => report.status !== DiagnosticReportStatus.final,
      ) && (
        <h3 className="text-xl font-semibold">{t("review_test_results")}</h3>
      )}

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
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastExpandedReport, setLastExpandedReport] =
    useState<SavedReportSignal | null>(null);
  const [editedConclusion, setEditedConclusion] = useState<string | null>(null);

  if (expandedReport !== lastExpandedReport) {
    setLastExpandedReport(expandedReport);
    if (expandedReport?.id === report.id) {
      setIsExpanded(true);
    }
  }

  const {
    data: fullReport,
    isPending: isLoadingReport,
    isFetching: isFetchingReport,
    isError: isReportError,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ["diagnosticReport", report.id],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: report.id,
      },
    }),
    enabled: isExpanded,
  });

  const {
    data: files,
    isSuccess: isFilesFetched,
    isFetching: isFetchingFiles,
  } = useQuery({
    queryKey: ["files", "diagnostic_report", report.id],
    queryFn: query.paginated(fileApi.list, {
      queryParams: {
        file_type: "diagnostic_report",
        associating_id: report.id,
      },
    }),
    enabled: isExpanded,
  });

  const { mutate: updateDiagnosticReport, isPending: isUpdatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.updateDiagnosticReport, {
        pathParams: {
          patient_external_id: patientId,
          external_id: report.id,
        },
      }),
      onSuccess: (updatedReport) => {
        toast.success(t("diagnostic_report_approved_successfully"));
        queryClient.setQueryData(
          ["diagnosticReport", report.id],
          updatedReport,
        );
        setEditedConclusion(null);
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest", facilityId, serviceRequestId],
        });
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", report.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["files", "diagnostic_report", report.id],
        });
      },
    });

  const conclusion =
    editedConclusion ?? fullReport?.conclusion ?? report.conclusion ?? "";
  const observations = (fullReport?.observations ?? []).filter(
    (observation) => observation.status !== ObservationStatus.ENTERED_IN_ERROR,
  );
  const hasContent =
    observations.length > 0 ||
    conclusion.trim().length > 0 ||
    (isFilesFetched &&
      !isFetchingFiles &&
      files.results.some((file) => !file.is_archived && file.upload_completed));
  const canApprove =
    !!fullReport &&
    fullReport.status === DiagnosticReportStatus.preliminary &&
    !isReportError &&
    !isFetchingReport &&
    !disableEdit &&
    !isUpdatingReport &&
    hasContent;

  const handleApprove = () => {
    if (!fullReport || !canApprove) return;

    updateDiagnosticReport({
      id: fullReport.id,
      status: DiagnosticReportStatus.final,
      category: fullReport.category,
      code: fullReport.code,
      note: fullReport.note,
      conclusion,
    });
  };

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <DiagnosticReportReviewHeader
          report={fullReport ?? report}
          patientId={patientId}
          isExpanded={isExpanded}
          showObservationHistory={observationDefinitions.length > 0}
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
                files={files?.results ?? []}
                facilityId={facilityId}
                patientId={patientId}
                conclusion={conclusion}
                onConclusionChange={setEditedConclusion}
                disableEdit={disableEdit || isUpdatingReport}
                canApprove={canApprove}
                onApprove={handleApprove}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
