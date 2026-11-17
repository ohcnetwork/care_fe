import { createFileRoute } from "@tanstack/react-router";

import PatientSelect from "@/pages/PublicAppointments/PatientSelect";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$staffId/patient-select",
)({
  component: RouteComponent,
  staticData: { sidebar: false },
});

function RouteComponent() {
  const { facilityId, staffId } = Route.useParams();
  return <PatientSelect facilityId={facilityId} staffId={staffId} />;
}
