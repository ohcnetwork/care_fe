import { useQuery } from "@tanstack/react-query";
import { MoreVertical, Printer } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { FileListTable } from "@/components/Files/FileListTable";

import { buildEncounterUrl } from "@/pages/Encounters/utils/utils";
import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
import { ObservationHistorySheet } from "@/pages/Facility/services/serviceRequests/components/ObservationHistorySheet";
import { DIAGNOSTIC_REPORT_STATUS_COLORS } from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { FileReadMinimal } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";

import { DiagnosticReportMetadata } from "./DiagnosticReportMetadata";

interface DiagnosticReportDetailCardProps {
  reportId: string;
  patientId: string;
  facilityId?: string;
}

export function DiagnosticReportDetailCard({
  reportId,
  patientId,
  facilityId,
}: DiagnosticReportDetailCardProps) {
  const { t } = useTranslation();

  const { data: report, isLoading: isReportLoading } = useQuery({
    queryKey: ["diagnosticReport", reportId],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: reportId,
      },
    }),
    enabled: !!reportId && !!patientId,
  });

  // Query to fetch files for the diagnostic report
  const { data: filesData } = useQuery<PaginatedResponse<FileReadMinimal>>({
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

  const files = filesData?.results || [];

  if (isReportLoading) {
    return <CardListSkeleton count={1} />;
  }

  if (!report) {
    return null;
  }

  const filteredObservations = report.observations?.filter(
    (obs) => obs.status !== ObservationStatus.ENTERED_IN_ERROR,
  );

  return (
    <Card className="shadow-sm border rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-gray-700 text-lg">
          <span>
            {report.service_request?.title ||
              t("diagnostic_report", { count: 1 })}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}>
            {t(report.status)}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    navigate(
                      buildEncounterUrl(
                        patientId,
                        `/diagnostic_reports/${report.id}/print`,
                        facilityId,
                      ),
                    )
                  }
                  data-shortcut-id="print-button"
                  aria-label={t("print")}
                >
                  <Printer className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("print")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {filteredObservations && filteredObservations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={t("test_results_actions")}
                >
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
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-4">
        <DiagnosticReportMetadata report={report} />

        {filteredObservations && filteredObservations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              {t("test_results")}
            </h4>
            <DiagnosticReportResultsTable observations={filteredObservations} />
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              {t("uploaded_files")}
            </h4>
            <FileListTable
              files={files}
              type="diagnostic_report"
              associatingId={report.id}
              canEdit={false}
              showHeader={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
