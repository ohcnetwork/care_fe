import { createFileRoute } from "@tanstack/react-router";

import PublicPatientRegistration from "@/pages/PublicAppointments/PatientRegistration";

export const Route = createFileRoute("/_patient/patient/add-profile")({
  component: PublicPatientRegistration,
  staticData: { patientChrome: false },
});
