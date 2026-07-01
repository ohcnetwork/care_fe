import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  FileCheck2,
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
import { PaginatedResponse } from "@/Utils/request/types";
import { formatName } from "@/Utils/utils";
import { Textarea } from "@/components/ui/textarea";
import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { FileReadMinimal } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";

interface DiagnosticReportReviewProps {
  facilityId: string;
  patientId: string;
  serviceRequestId: string;
  diagnosticReports: DiagnosticReportRead[];
  disableEdit: boolean;
}

export function DiagnosticReportReview({
  facilityId,
  patientId,
  diagnosticReports,
  disableEdit,
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
          disableEdit={disableEdit}
        />
      ))}
    </div>
  );
}

function DiagnosticReportReviewItem({
  report,
  facilityId,
  patientId,
  disableEdit,
}: {
  report: DiagnosticReportRead;
  facilityId: string;
  patientId: string;
  disableEdit: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [conclusion, setConclusion] = useState<string>(report.conclusion || "");
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const { data: fullReport } = useQuery({
    queryKey: ["diagnosticReport", report.id],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: report.id,
      },
    }),
    enabled: !!report.id && isExpanded,
  });

  const { data: files = { results: [], count: 0 } } = useQuery<
    PaginatedResponse<FileReadMinimal>
  >({
    queryKey: ["files", "diagnostic_report", report.id],
    queryFn: query(fileApi.list, {
      queryParams: {
        file_type: "diagnostic_report",
        associating_id: report.id,
        limit: 100,
        offset: 0,
      },
    }),
    enabled: !!report.id && isExpanded,
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
        // Invalidate all related queries to update workflow status
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest"],
        });
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport"],
        });
        queryClient.invalidateQueries({
          queryKey: ["files"],
        });
      },
    });

  // Prefer the full detail (with observations); fall back to the list report
  // while the detail request is still loading.
  const reportDetail = fullReport ?? report;

  useEffect(() => {
    setConclusion(reportDetail?.conclusion || "");
  }, [reportDetail?.conclusion]);

  const handleApprove = () => {
    updateDiagnosticReport({
      id: reportDetail.id,
      status: DiagnosticReportStatus.final,
      category: reportDetail.category,
      code: reportDetail.code,
      note: reportDetail.note,
      conclusion: conclusion,
    });
  };

  const isReportNotReviewable =
    (!reportDetail.observations || reportDetail.observations.length === 0) &&
    (!files?.results || files.results.length === 0) &&
    !reportDetail.conclusion;

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
            <div className="flex justify-between items-center rounded-md">
              <div className="flex items-center gap-2">
                <CardTitle
                  className={cn(
                    "text-gray-950 ml-2",
                    isReportNotReviewable && "text-gray-400",
                  )}
                >
                  <p className="flex items-center gap-3">
                    <FileCheck2 className="size-6  font-normal text-base stroke-[1.5px]" />{" "}
                    <span className="text-base/9  font-medium">
                      {report.code?.display ?? report.service_request?.title}
                    </span>
                  </p>
                </CardTitle>
              </div>
              <div className="flex items-center gap-5">
                {isReportNotReviewable && (
                  <span className="text-sm/9 text-gray-400 font-medium">
                    {t("no_observations_entered")}
                  </span>
                )}
                {report.created_by && (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={formatName(report.created_by, true)}
                      className="size-5"
                      imageUrl={report.created_by.profile_picture_url}
                    />
                    <span className="text-sm/9 text-gray-700 font-medium">
                      {formatName(report.created_by)}
                    </span>
                  </div>
                )}
                <Badge variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}>
                  {t(report.status)}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 border border-gray-400 bg-white shadow p-4"
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
                    {reportDetail.code?.display}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {(reportDetail.observations?.length ?? 0) === 0 && (
                    <p className="text-gray-800 whitespace-pre-wrap p-2 rounded-lg bg-white border cursor-default text-center">
                      {t("no_observations_entered")}
                    </p>
                  )}
                  <DiagnosticReportResultsTable
                    observations={(reportDetail.observations ?? []).filter(
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
                  {reportDetail.status === DiagnosticReportStatus.final ? (
                    <p className="text-gray-800 whitespace-pre-wrap p-2 rounded-lg bg-white border border-gray-200 cursor-default">
                      {reportDetail.conclusion || t("no_conclusion_entered")}
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
                <div className="flex justify-end">
                  <Link
                    basePath="/"
                    href={`/facility/${facilityId}/patient/${patientId}/diagnostic_reports/${report.id}`}
                  >
                    <Button variant="primary" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      {t("view_report")}
                    </Button>
                  </Link>
                </div>
              )}

              {report.status === DiagnosticReportStatus.preliminary && (
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    disabled={disableEdit || isUpdatingReport}
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
