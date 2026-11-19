import { createFileRoute, useParams } from "@tanstack/react-router";

import ReportViewer from "@/pages/Encounters/ReportViewer";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/report/template/$templateSlug",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { encounterId, templateSlug } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/report/template/$templateSlug",
  });
  return <ReportViewer encounterId={encounterId} templateSlug={templateSlug} />;
}
