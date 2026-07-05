import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import query from "@/Utils/request/query";
import Loading from "@/components/Common/Loading";
import { DiagnosticReportPreview } from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPreview";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
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

  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["serviceRequest", facilityId, serviceRequestId],
    queryFn: query(serviceRequestApi.retrieveServiceRequest, {
      pathParams: {
        facilityId: facilityId,
        serviceRequestId: serviceRequestId,
      },
    }),
  });

  const diagnosticReportIds = request?.diagnostic_reports
    ?.filter((report) => report.status === DiagnosticReportStatus.final)
    ?.map((report) => report.id);

  if (!diagnosticReportId && !serviceRequestId) {
    return <div>{t("service_request_not_found")}</div>;
  }

  if (serviceRequestId && isLoadingRequest) {
    return <Loading />;
  }

  if (!request) {
    return null;
  }

  const resolvedDiagnosticReportIds = diagnosticReportId
    ? [diagnosticReportId]
    : (diagnosticReportIds ?? []);

  if (resolvedDiagnosticReportIds.length === 0) {
    return <div>{t("no_diagnostic_reports_found")}</div>;
  }

  return (
    <DiagnosticReportPreview
      diagnosticReportIds={resolvedDiagnosticReportIds}
      patientId={patientId}
      serviceRequest={request}
    />
  );
}
