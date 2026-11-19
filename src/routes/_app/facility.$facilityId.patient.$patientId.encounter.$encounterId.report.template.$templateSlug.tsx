import { createFileRoute } from "@tanstack/react-router";

import ReportViewer from "@/pages/Encounters/ReportViewer";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/report/template/$templateSlug",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { encounterId, templateSlug } = Route.useParams();
  return <ReportViewer encounterId={encounterId} templateSlug={templateSlug} />;
}
