import { createFileRoute, useParams } from "@tanstack/react-router";

import { facilityServicesSearch } from "@/lib/router/search/services";
import FacilityServices from "@/pages/Facility/services/FacilityServices";

export const Route = createFileRoute("/_app/facility/$facilityId/services/")({
  validateSearch: facilityServicesSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/services/",
  });
  return <FacilityServices facilityId={facilityId} />;
}
