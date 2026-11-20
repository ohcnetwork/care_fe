import { createFileRoute } from "@tanstack/react-router";

import PatientVisits from "@/pages/Patient/PatientVisits";

export const Route = createFileRoute("/_patient/patient/visits")({
  component: PatientVisits,
});
