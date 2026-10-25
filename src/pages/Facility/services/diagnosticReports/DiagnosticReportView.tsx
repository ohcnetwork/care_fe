import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, Printer } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import BackButton from "@/components/Common/BackButton";
import { FileListTable } from "@/components/Files/FileListTable";

import { PatientHeader } from "@/components/Patient/PatientHeader";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
import { DiagnosticReportSummary } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportSummary";
import { ObservationHistorySheet } from "@/pages/Facility/services/serviceRequests/components/ObservationHistorySheet";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { FileReadMinimal } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

export default function DiagnosticReportView({
  facilityId,
  patientId,
  diagnosticReportId,
}: {
  facilityId: string;
  patientId: string;
  diagnosticReportId: string;
}) {
  const { t } = useTranslation();
  useShortcutSubContext("facility:service");

  const { data: report, isLoading } = useQuery({
    queryKey: ["diagnosticReport", diagnosticReportId],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: diagnosticReportId,
      },
    }),
  });

  // Query to fetch files for the diagnostic report
  const { data: files = { results: [], count: 0 } } = useQuery<
    PaginatedResponse<FileReadMinimal>
  >({
    queryKey: ["files", "diagnostic_report", report?.id],
    queryFn: query(fileApi.list, {
      queryParams: {
        file_type: "diagnostic_report",
        associating_id: report?.id,
        limit: 100,
        offset: 0,
      },
    }),
    enabled: !!report?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-6 flex justify-between">
        <BackButton>
          <ArrowLeft />
          <span>{t("back")}</span>
        </BackButton>
        <Button
          variant="outline"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/patient/${report.encounter.patient.id}/diagnostic_reports/${diagnosticReportId}/print`,
            )
          }
        >
          <Printer className="h-4 w-4 mr-2" />
          {t("print")}
          <ShortcutBadge actionId="print-report" />
        </Button>
      </div>

      <div className="space-y-6">
        <PatientHeader
          patient={report.encounter.patient}
          facilityId={report.encounter.facility.id}
          className="md:p-0 p-0"
        />
        <DiagnosticReportSummary
          report={report}
          title={report.service_request?.title}
          createdDate={report.created_date}
          requester={report.requester}
        />
        {files?.results && files.results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("uploaded_files")}</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <FileListTable
                files={files.results}
                type="diagnostic_report"
                associatingId={report.id}
                canEdit={true}
                showHeader={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {report.observations && report.observations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("test_results")}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={t("test_results_actions")}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ObservationHistorySheet
                      patientId={report.encounter.patient.id}
                      diagnosticReportId={diagnosticReportId}
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
              </div>
            </CardHeader>
            <CardContent>
              <DiagnosticReportResultsTable
                observations={report.observations.filter(
                  (obs) => obs.status !== ObservationStatus.ENTERED_IN_ERROR,
                )}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
