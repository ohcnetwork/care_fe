import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import query from "@/Utils/request/query";
import Loading from "@/components/Common/Loading";
import { DiagnosticReportPreview } from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPreview";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
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

  const { data: data, isLoading: isLoadingReports } = useQuery({
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
    : data?.results?.filter(
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
      isLoading={isLoadingReports || isLoadingReport}
      serviceRequest={request}
    />
  );
}
