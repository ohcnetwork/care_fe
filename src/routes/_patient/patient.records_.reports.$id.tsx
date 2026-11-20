import { createFileRoute } from "@tanstack/react-router";

import DiagnosticReportDetail from "@/pages/Patient/DiagnosticReportDetail";

export const Route = createFileRoute("/_patient/patient/records_/reports/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <DiagnosticReportDetail id={id} />;
}
