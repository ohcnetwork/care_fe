import { createFileRoute } from "@tanstack/react-router";

import VisitSummary from "@/pages/Patient/VisitSummary";

export const Route = createFileRoute(
  "/_patient/patient/visits_/$appointmentId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { appointmentId } = Route.useParams();
  return <VisitSummary appointmentId={appointmentId} />;
}
