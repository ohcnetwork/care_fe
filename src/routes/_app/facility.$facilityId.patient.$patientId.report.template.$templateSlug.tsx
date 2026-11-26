import { createFileRoute, useParams } from "@tanstack/react-router";

import ReportViewer from "@/pages/Encounters/ReportViewer";
import { ReportType } from "@/types/emr/report/report";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/report/template/$templateSlug",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, templateSlug } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/report/template/$templateSlug",
  });
  return (
    <ReportViewer
      associatingId={patientId}
      templateSlug={templateSlug}
      reportType={ReportType.PATIENT_SUMMARY}
    />
  );
}
