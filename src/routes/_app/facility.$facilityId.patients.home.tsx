import { createFileRoute } from "@tanstack/react-router";

import { patientHomePageSearch } from "@/lib/router/search/patient";
import PatientHome from "@/pages/Patient/PatientHome";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patients/home",
)({ validateSearch: patientHomePageSearch, component: PatientHome });
