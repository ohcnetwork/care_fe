import { createFileRoute, useParams } from "@tanstack/react-router";

import { serviceRequestListSearch } from "@/lib/router/search/services";
import ServiceRequestList from "@/pages/Facility/services/serviceRequests/ServiceRequestList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/service_requests/",
)({
  validateSearch: serviceRequestListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/service_requests/",
  });
  return <ServiceRequestList facilityId={facilityId} locationId={locationId} />;
}
