import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  FileCheck2,
} from "lucide-react";
import { Info } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import { FileListTable } from "@/components/Files/FileListTable";
import { FileUploadModel } from "@/components/Patient/models";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
import { DIAGNOSTIC_REPORT_STATUS_COLORS } from "@/types/emr/diagnosticReport/diagnosticReport";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";

interface DiagnosticReportReviewProps {
  facilityId: string;
  patientId: string;
  serviceRequestId: string;
  diagnosticReports: DiagnosticReportRead[];
}

export function DiagnosticReportReview({
  facilityId,
  patientId,
  diagnosticReports,
}: DiagnosticReportReviewProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [conclusion, setConclusion] = useState<string>("");
  const queryClient = useQueryClient();
  const latestReport = diagnosticReports[0];

  // Fetch the full diagnostic report to get observations
  const { data: fullReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ["diagnosticReport", latestReport?.id],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: latestReport?.id || "",
      },
    }),
    enabled: !!latestReport?.id,
  });

  useEffect(() => {
    if (fullReport?.conclusion) {
      setConclusion(fullReport.conclusion);
    }
  }, [fullReport]);

  const { data: files = { results: [], count: 0 }, refetch: refetchFiles } =
    useQuery<PaginatedResponse<FileUploadModel>>({
      queryKey: ["files", "diagnostic_report", fullReport?.id],
      queryFn: query(routes.viewUpload, {
        queryParams: {
          file_type: "diagnostic_report",
          associating_id: fullReport?.id,
          limit: 100,
          offset: 0,
        },
      }),
      enabled: !!fullReport?.id,
    });

  const { mutate: updateDiagnosticReport, isPending: isUpdatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.updateDiagnosticReport, {
        pathParams: {
          patient_external_id: patientId,
          external_id: latestReport?.id || "",
        },
      }),
      onSuccess: () => {
        toast.success("Diagnostic report approved successfully");
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
      onError: (err: any) => {
        toast.error(
          `Failed to approve diagnostic report: ${err.message || "Unknown error"}`,
        );
      },
    });

  const handleApprove = () => {
    if (latestReport) {
      updateDiagnosticReport({
        ...latestReport,
        status: DiagnosticReportStatus.final,
        conclusion,
      });
    }
  };

  if (!latestReport) {
    return null;
  }

  // Show loading state while fetching the report
  if (isLoadingReport) {
    return (
      <Card className="shadow-lg border">
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

  // Don't show the report review if there are no observations and no files
  if (
    (!fullReport?.observations || fullReport.observations.length === 0) &&
    (!files?.results || files.results.length === 0)
  ) {
    return null;
  }

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg cursor-pointer bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild className="px-2 py-4">
          <CardHeader>
            <div className="flex justify-between items-center rounded-md">
              <div className="flex items-center gap-2">
                <CardTitle>
                  <p className="flex items-center gap-1.5">
                    <FileCheck2 className="size-[24px] text-gray-950 font-normal text-base stroke-[1.5px]" />{" "}
                    {fullReport?.code ? (
                      <>
                        {fullReport?.code?.display}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="size-4 text-gray-600 inline-block cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {fullReport?.code?.system}
                                {", "}
                                {fullReport?.code?.code}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    ) : (
                      <span className="text-base/9 text-gray-950 font-medium">
                        {t("result_review")}
                      </span>
                    )}
                  </p>
                </CardTitle>
              </div>
              <div className="flex items-center gap-5">
                {fullReport?.created_by && (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={
                        fullReport.created_by.first_name ||
                        fullReport.created_by.username ||
                        ""
                      }
                      className="size-5"
                      imageUrl={fullReport.created_by.profile_picture_url}
                    />
                    <span className="text-sm/9 text-gray-700 font-medium">
                      {fullReport.created_by.first_name || ""}{" "}
                      {fullReport.created_by.last_name || ""}
                    </span>
                  </div>
                )}
                {fullReport && (
                  <Badge
                    variant={DIAGNOSTIC_REPORT_STATUS_COLORS[fullReport.status]}
                  >
                    {t(fullReport.status)}
                  </Badge>
                )}
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
            {fullReport && (
              <div className="space-y-6">
                <Card className="shadow-none rounded-lg border-gray-200 bg-gray-50">
                  <CardContent className="p-4">
                    {fullReport.observations.length == 0 && (
                      <p className="text-gray-800 whitespace-pre-wrap p-2 rounded-lg bg-white border cursor-default text-center">
                        {t("no") + " " + t("observations") + " " + t("entered")}
                      </p>
                    )}
                    <DiagnosticReportResultsTable
                      observations={fullReport.observations.filter(
                        (obs) =>
                          obs.status !== ObservationStatus.ENTERED_IN_ERROR,
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-none rounded-lg border-gray-200 bg-gray-50">
                  <CardContent className="p-4 space-y-2">
                    <Label htmlFor="conclusion" className="font-medium">
                      {t("conclusion")}
                    </Label>
                    {fullReport?.status === DiagnosticReportStatus.final ? (
                      <p className="text-gray-800 whitespace-pre-wrap p-2 rounded-lg bg-white border border-gray-200 cursor-default">
                        {fullReport?.conclusion ||
                          t("no") + " " + t("conclusion") + " " + t("entered")}
                      </p>
                    ) : (
                      <textarea
                        id="conclusion"
                        className="w-full field-sizing-content focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-lg"
                        placeholder={t("enter") + " " + t("conclusion")}
                        value={conclusion || fullReport?.conclusion || ""}
                        onChange={(e) => setConclusion(e.target.value)}
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
                        associatingId={fullReport.id}
                        canEdit={true}
                        showHeader={false}
                        onRefetch={refetchFiles}
                      />
                    </CardContent>
                  </Card>
                )}

                {fullReport?.status === DiagnosticReportStatus.final && (
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      className="gap-2"
                      onClick={() =>
                        navigate(
                          `/facility/${facilityId}/patient/${patientId}/diagnostic_reports/${fullReport?.id}`,
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("view") + " " + t("report")}
                    </Button>
                  </div>
                )}

                {fullReport?.status === DiagnosticReportStatus.preliminary && (
                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="primary"
                          disabled={isUpdatingReport}
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve Results
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to approve these diagnostic
                            results? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleApprove}>
                            Approve
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
