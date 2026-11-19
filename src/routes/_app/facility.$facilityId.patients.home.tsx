import { createFileRoute } from "@tanstack/react-router";

import PatientHome from "@/pages/Patient/PatientHome";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patients/home",
)({ component: PatientHome });
