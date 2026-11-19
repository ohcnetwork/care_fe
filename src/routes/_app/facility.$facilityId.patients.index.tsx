import { createFileRoute } from "@tanstack/react-router";

import PatientIndex from "@/components/Patient/PatientIndex";

export const Route = createFileRoute("/_app/facility/$facilityId/patients/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <PatientIndex facilityId={facilityId} />;
}
