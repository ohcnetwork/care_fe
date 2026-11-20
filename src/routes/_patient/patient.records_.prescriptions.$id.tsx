import { createFileRoute } from "@tanstack/react-router";

import PrescriptionDetail from "@/pages/Patient/PrescriptionDetail";

export const Route = createFileRoute(
  "/_patient/patient/records_/prescriptions/$id",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <PrescriptionDetail id={id} />;
}
