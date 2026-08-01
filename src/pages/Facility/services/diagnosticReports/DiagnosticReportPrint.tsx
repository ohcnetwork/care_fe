import { useQueries, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import query from "@/Utils/request/query";
import Loading from "@/components/Common/Loading";
import { DiagnosticReportPreview } from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPreview";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";

export default function DiagnosticReportPrint({
  patientId,
  diagnosticReportId,
  serviceRequestId,
  facilityId,
}: {
  patientId: string;
  diagnosticReportId?: string;
  serviceRequestId: string;
  facilityId: string;
}) {
  const { t } = useTranslation();

  const { data: data } = useQuery({
    queryKey: ["diagnosticReports", patientId, serviceRequestId],
    queryFn: query(diagnosticReportApi.listDiagnosticReports, {
      pathParams: { patient_external_id: patientId },
      queryParams: {
        service_request: serviceRequestId,
      },
    }),
    enabled: !diagnosticReportId,
  });

  const { data: fullReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ["diagnosticReport", diagnosticReportId],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: diagnosticReportId,
      },
    }),
    enabled: !!diagnosticReportId,
  });

  const diagnosticReportResults = data?.results;

  const { allDiagnosticReports, isLoading: isLoadingReports } = useQueries({
    queries:
      diagnosticReportResults?.map((report) => ({
        queryKey: ["diagnosticReport", report.id, patientId, facilityId],
        queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
          pathParams: {
            patient_external_id: patientId,
            external_id: report.id,
          },
          queryParams: { facility: facilityId },
        }),
        enabled: !diagnosticReportId,
      })) ?? [],
    combine: (results) => ({
      allDiagnosticReports: results
        .map((r) => r.data)
        .filter((data): data is DiagnosticReportRead => !!data),
      isLoading: results.some((r) => r.isLoading || r.isFetching),
    }),
  });

  const { data: request } = useQuery({
    queryKey: ["serviceRequest", facilityId, serviceRequestId],
    queryFn: query(serviceRequestApi.retrieveServiceRequest, {
      pathParams: {
        facilityId: facilityId,
        serviceRequestId: serviceRequestId,
      },
    }),
  });

  const diagnosticReports = fullReport
    ? [fullReport]
    : allDiagnosticReports.filter(
        (report) => report.status === DiagnosticReportStatus.final,
      );

  if (isLoadingReport || isLoadingReports) {
    return <Loading />;
  }

  if (!request) {
    return <div>{t("service_request_not_found")}</div>;
  }

  if (!diagnosticReports) {
    return <div>{t("no_diagnostic_reports_found")}</div>;
  }

  return (
    <DiagnosticReportPreview
      diagnosticReports={diagnosticReports}
      isLoading={isLoadingReport || isLoadingReports}
      serviceRequest={request}
    />
  );
}
