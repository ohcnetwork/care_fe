import { createFileRoute, useParams } from "@tanstack/react-router";

import PublicPatientRegistration from "@/pages/PublicAppointments/PatientRegistration";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$staffId/patient-registration",
)({
  component: RouteComponent,
  staticData: { patientChrome: false },
});

function RouteComponent() {
  const { facilityId, staffId } = useParams({
    from: "/_patient/facility/$facilityId/appointments/$staffId/patient-registration",
  });
  return (
    <PublicPatientRegistration facilityId={facilityId} staffId={staffId} />
  );
}
