import { createFileRoute, useParams } from "@tanstack/react-router";

import { publicAppointmentPatientSearch } from "@/lib/router/search/appointments";
import PatientSelect from "@/pages/PublicAppointments/PatientSelect";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$staffId/patient-select",
)({
  validateSearch: publicAppointmentPatientSearch,
  component: RouteComponent,
  staticData: { patientChrome: false },
});

function RouteComponent() {
  const { facilityId, staffId } = useParams({
    from: "/_patient/facility/$facilityId/appointments/$staffId/patient-select",
  });
  return <PatientSelect facilityId={facilityId} staffId={staffId} />;
}
