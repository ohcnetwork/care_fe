import { createFileRoute } from "@tanstack/react-router";

import ServiceRequestList from "@/pages/Facility/services/serviceRequests/ServiceRequestList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/service_requests/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = Route.useParams();
  return <ServiceRequestList facilityId={facilityId} locationId={locationId} />;
}
