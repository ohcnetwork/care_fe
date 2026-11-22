import { createFileRoute, useParams } from "@tanstack/react-router";

import PatientIndex from "@/components/Patient/PatientIndex";
import { patientSearchPageSearch } from "@/lib/router/search/patient";

export const Route = createFileRoute("/_app/facility/$facilityId/patients/")({
  validateSearch: patientSearchPageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/patients/",
  });
  return <PatientIndex facilityId={facilityId} />;
}
