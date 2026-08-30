import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  FileCheck2,
  FileText,
  MoreVertical,
  Printer,
} from "lucide-react";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";

import { Avatar } from "@/components/Common/Avatar";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { FileListTable } from "@/components/Files/FileListTable";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
import { ObservationHistorySheet } from "@/pages/Facility/services/serviceRequests/components/ObservationHistorySheet";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { ObservationDefinitionRead } from "@/types/emr/observationDefinition/observationDefinition";
import fileApi from "@/types/files/fileApi";
import { format } from "date-fns";

interface DiagnosticReportReviewProps {
  facilityId: string;
  patientId: string;
  diagnosticReports: DiagnosticReportRead[];
  observationDefinitions: ObservationDefinitionRead[];
  serviceRequestId: string;
  disableEdit: boolean;
  expandedReportId: string | null;
}

export function DiagnosticReportReview({
  facilityId,
  patientId,
  diagnosticReports,
  serviceRequestId,
  observationDefinitions,
  disableEdit,
  expandedReportId,
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
          facilityId={facilityId}
          patientId={patientId}
          serviceRequestId={serviceRequestId}
          observationDefinitions={observationDefinitions}
          disableEdit={disableEdit}
          expandedReportId={expandedReportId}
        />
      ))}
    </div>
  );
}

function DiagnosticReportReviewItem({
  report,
  facilityId,
  patientId,
  serviceRequestId,
  observationDefinitions,
  disableEdit,
  expandedReportId,
}: {
  report: DiagnosticReportRead;
  facilityId: string;
  patientId: string;
  serviceRequestId: string;
  observationDefinitions: ObservationDefinitionRead[];
  disableEdit: boolean;
  expandedReportId: string | null;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isExpanded, setIsExpanded] = useState(false);

  const [conclusion, setConclusion] = useState<string>(report.conclusion || "");
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const { data: fullReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ["diagnosticReport", report.id],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: report.id,
      },
    }),
  });

  const { data: files = { results: [], count: 0 }, isFetched: isFilesFetched } =
    useQuery({
      queryKey: ["files", "diagnostic_report", report.id],
      queryFn: query.paginated(fileApi.list, {
        queryParams: {
          file_type: "diagnostic_report",
          associating_id: report.id,
        },
      }),
    });

  const { mutate: updateDiagnosticReport, isPending: isUpdatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.updateDiagnosticReport, {
        pathParams: {
          patient_external_id: patientId,
          external_id: report.id,
        },
      }),
      onSuccess: () => {
        toast.success(t("diagnostic_report_approved_successfully"));
        // Invalidate only the queries affected by this approval
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

  useEffect(() => {
    if (expandedReportId?.split(":")[0] === report.id) {
      setIsExpanded(true);
    }
  }, [expandedReportId, report.id]);

  useEffect(() => {
    setConclusion(fullReport?.conclusion || "");
  }, [fullReport?.conclusion]);

  if (isLoadingReport) {
    return (
      <Card className="shadow-none border-gray-300 rounded-lg bg-white">
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fullReport) {
    return null;
  }

  const handleApprove = () => {
    updateDiagnosticReport({
      id: fullReport.id,
      status: DiagnosticReportStatus.final,
      category: fullReport.category,
      code: fullReport.code,
      note: fullReport.note,
      conclusion: conclusion,
    });
  };

  const nonDeletedObservations = fullReport.observations.filter(
    (obs) => obs.status !== ObservationStatus.ENTERED_IN_ERROR,
  );

  const nonArchivedFiles = files.results.filter((file) => !file.is_archived);

  const isReportNotReviewable =
    isFilesFetched &&
    !nonDeletedObservations.length &&
    !nonArchivedFiles.length &&
    !fullReport.conclusion;

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg cursor-pointer bg-white",
        isExpanded && "bg-gray-100",
        isReportNotReviewable && !isExpanded && "bg-gray-50 cursor-default",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild className="px-2 py-4">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 rounded-md">
              <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                <CardTitle
                  className={cn(
                    "text-gray-950 min-w-0",
                    isReportNotReviewable && "text-gray-400",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCheck2 className="size-6 shrink-0 text-gray-950 stroke-[1.5px]" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-base text-gray-950 font-medium truncate">
                        {report.code?.display ?? report.service_request?.title}
                      </span>
                      <span className="text-sm text-gray-500 truncate">
                        {t("last_updated")}:{" "}
                        {format(
                          fullReport.modified_date,
                          "hh:mm a, MMM dd, yyyy",
                        )}
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-5 w-full sm:w-auto">
                {isReportNotReviewable && (
                  <span className="text-sm text-gray-400 font-medium">
                    {t("no_observations_entered")}
                  </span>
                )}
                {fullReport.created_by && (
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      name={formatName(fullReport.created_by, true)}
                      className="size-5 shrink-0"
                      imageUrl={fullReport.created_by.profile_picture_url}
                    />
                    <span className="text-sm text-gray-700 font-medium truncate">
                      {formatName(fullReport.created_by)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}
                  >
                    {t(report.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronsDownUp className="size-5" />
                    ) : (
                      <ChevronsUpDown className="size-5" />
                    )}
                  </Button>
                  {observationDefinitions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ObservationHistorySheet
                          patientId={patientId}
                          diagnosticReportId={report.id}
                        >
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {t("view_observation_history")}
                          </DropdownMenuItem>
                        </ObservationHistorySheet>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-2 bg-gray-100">
            <div className="space-y-6">
              <Card className="shadow-none rounded-lg border-gray-200 bg-gray-50">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-base font-semibold">
                    {fullReport.code?.display}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {(fullReport.observations?.length ?? 0) === 0 && (
                    <p className="text-gray-800 whitespace-pre-wrap p-2 rounded-lg bg-white border cursor-default text-center">
                      {t("no_observations_entered")}
                    </p>
                  )}
                  <DiagnosticReportResultsTable
                    observations={(fullReport.observations ?? []).filter(
                      (obs) =>
                        obs.status !== ObservationStatus.ENTERED_IN_ERROR,
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-none rounded-lg border-gray-200 bg-gray-50">
                <CardContent className="p-4 space-y-2">
                  <Label
                    htmlFor={`conclusion-${report.id}`}
                    className="font-medium"
                  >
                    {t("conclusion")}
                  </Label>
                  {fullReport.status === DiagnosticReportStatus.final ? (
                    <p className="text-gray-800 whitespace-pre-wrap p-2 rounded-lg bg-white border border-gray-200 cursor-default">
                      {fullReport.conclusion || t("no_conclusion_entered")}
                    </p>
                  ) : (
                    <Textarea
                      id={`conclusion-${report.id}`}
                      className="w-full field-sizing-content focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-lg disabled:cursor-not-allowed"
                      placeholder={t("enter_conclusion")}
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      disabled={disableEdit}
                    />
                  )}
                </CardContent>
              </Card>

              {files?.results && files.results.length > 0 && (
                <Card className="shadow-none rounded-lg border-gray-200 bg-gray-50">
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-base font-medium">
                      {t("uploaded_files")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <FileListTable
                      files={files.results}
                      type="diagnostic_report"
                      associatingId={report.id}
                      canEdit={!disableEdit}
                      showHeader={false}
                    />
                  </CardContent>
                </Card>
              )}

              {report.status === DiagnosticReportStatus.final && (
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
                    disabled={
                      disableEdit || isUpdatingReport || isReportNotReviewable
                    }
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
                    description={t(
                      "are_you_sure_want_to_approve_diagnostic_report",
                    )}
                    confirmText={t("approve")}
                    onConfirm={handleApprove}
                    disabled={isUpdatingReport || disableEdit}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
