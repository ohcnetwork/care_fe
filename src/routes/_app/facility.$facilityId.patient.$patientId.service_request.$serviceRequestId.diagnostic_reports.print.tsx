import { createFileRoute } from "@tanstack/react-router";

import { MultipleDiagnosticReportsPrint } from "@/pages/Facility/services/diagnosticReports/MultipleDiagnosticReportsPrint";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/service_request/$serviceRequestId/diagnostic_reports/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, serviceRequestId } = Route.useParams();
  return (
    <MultipleDiagnosticReportsPrint
      patientId={patientId}
      serviceRequestId={serviceRequestId}
    />
  );
}
