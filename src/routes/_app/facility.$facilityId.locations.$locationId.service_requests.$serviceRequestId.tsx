import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";
import ServiceRequestShow from "@/pages/Facility/services/serviceRequests/ServiceRequestShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/service_requests/$serviceRequestId",
)({
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { facilityId, locationId, serviceRequestId } = Route.useParams();
  return (
    <ServiceRequestShow
      facilityId={facilityId}
      locationId={locationId}
      serviceRequestId={serviceRequestId}
    />
  );
}
