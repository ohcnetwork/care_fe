import { createFileRoute, useParams } from "@tanstack/react-router";

import { MultipleDiagnosticReportsPrint } from "@/pages/Facility/services/diagnosticReports/MultipleDiagnosticReportsPrint";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/service_request/$serviceRequestId/diagnostic_reports/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, serviceRequestId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/service_request/$serviceRequestId/diagnostic_reports/print",
  });
  return (
    <MultipleDiagnosticReportsPrint
      patientId={patientId}
      serviceRequestId={serviceRequestId}
    />
  );
}
