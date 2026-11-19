import { createFileRoute } from "@tanstack/react-router";

import PublicPatientRegistration from "@/pages/PublicAppointments/PatientRegistration";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$staffId/patient-registration",
)({
  component: RouteComponent,
  staticData: { patientChrome: false },
});

function RouteComponent() {
  const { facilityId, staffId } = Route.useParams();
  return (
    <PublicPatientRegistration facilityId={facilityId} staffId={staffId} />
  );
}
