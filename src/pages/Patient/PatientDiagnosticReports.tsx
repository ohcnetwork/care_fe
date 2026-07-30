import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import patientPortalApi from "@/types/emr/patientPortal/patientPortalApi";

import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";

function DiagnosticReportCard({
  report,
  token,
}: {
  report: DiagnosticReportRead;
  token?: string;
}) {
  const { t } = useTranslation();

  const { data: detail, isLoading } = useQuery({
    queryKey: ["portal-diagnostic-report", report.id],
    queryFn: query(patientPortalApi.getDiagnosticReport, {
      pathParams: { id: report.id },
      headers: { Authorization: `Bearer ${token}` },
    }),
    enabled: !!token,
  });

  return (
    <Card className="shadow-sm overflow-hidden">
      <Collapsible>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="px-6 pb-3 bg-secondary-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <CardTitle>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {report.service_request?.title ||
                    report.code?.display ||
                    t("diagnostic_report", { count: 1 })}
                </span>
                <span className="text-xs text-gray-600">
                  {formatDateTime(report.created_date)}
                </span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}>
                {t(report.status)}
              </Badge>
              <CareIcon icon="l-angle-down" className="size-4" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-4 px-2 md:px-6 pb-3 space-y-3">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : detail?.observations && detail.observations.length > 0 ? (
              <DiagnosticReportResultsTable
                observations={detail.observations}
              />
            ) : (
              <p className="text-sm text-gray-500 px-2">
                {t("no_results_found")}
              </p>
            )}
            {detail?.conclusion && (
              <div className="px-2">
                <span className="text-xs font-medium">{t("conclusion")}: </span>
                <span className="text-sm">{detail.conclusion}</span>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function PatientDiagnosticReports() {
  const { t } = useTranslation();

  const patient = usePatientContext();
  const tokenData = patient?.tokenData;

  if (!tokenData) {
    navigate("/login");
  }

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["portal-diagnostic-reports", tokenData?.phoneNumber],
    queryFn: query(patientPortalApi.listDiagnosticReports, {
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    enabled: !!tokenData?.token,
  });

  const reports = reportsData?.results
    ?.slice()
    .sort(
      (a, b) =>
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime(),
    );

  return (
    <div className="container mx-auto mt-2">
      <div className="flex justify-between w-full">
        <span className="text-xl font-bold">{t("diagnostic_reports")}</span>
      </div>
      <div className="grid gap-4 mt-4">
        {isLoading ? (
          <CardListSkeleton count={4} />
        ) : reports && reports.length > 0 ? (
          reports.map((report) => (
            <DiagnosticReportCard
              key={report.id}
              report={report}
              token={tokenData?.token}
            />
          ))
        ) : (
          <EmptyState
            icon={
              <CareIcon icon="l-file-medical" className="text-primary size-6" />
            }
            title={t("no_diagnostic_reports_found")}
          />
        )}
      </div>
    </div>
  );
}
