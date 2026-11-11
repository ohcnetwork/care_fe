import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { hasMarkdownContent } from "@/Utils/markdown";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import {
  ObservationRead,
  ObservationStatus,
} from "@/types/emr/observation/observation";
import { FileReadMinimal } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";

interface UseDiagnosticReportReviewProps {
  report: DiagnosticReportRead;
  facilityId: string;
  patientId: string;
  serviceRequestId: string;
  disableEdit: boolean;
  isExpanded: boolean;
}

function hasReportContent(
  observations: ObservationRead[],
  conclusion: string,
  files: FileReadMinimal[],
) {
  return (
    observations.length > 0 ||
    hasMarkdownContent(conclusion) ||
    files.some((file) => !file.is_archived && file.upload_completed)
  );
}

export function useDiagnosticReportReview({
  report,
  facilityId,
  patientId,
  serviceRequestId,
  disableEdit,
  isExpanded,
}: UseDiagnosticReportReviewProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editedConclusion, setEditedConclusion] = useState<string | null>(null);
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
  const hasContent = hasReportContent(
    observations,
    conclusion,
    isFilesFetched && !isFetchingFiles ? files.results : [],
  );
  const canApprove =
    !!fullReport &&
    fullReport.status === DiagnosticReportStatus.preliminary &&
    !isReportError &&
    !isFetchingReport &&
    !disableEdit &&
    !isUpdatingReport &&
    hasContent;

  const onApprove = () => {
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

  return {
    fullReport,
    isLoadingReport,
    isReportError,
    refetchReport,
    files: files?.results ?? [],
    isFilesFetched,
    isUpdatingReport,
    conclusion,
    onConclusionChange: setEditedConclusion,
    observations,
    hasContent,
    canApprove,
    onApprove,
  };
}
