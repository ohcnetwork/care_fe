import { createFileRoute, useParams } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";
import ServiceRequestShow from "@/pages/Facility/services/serviceRequests/ServiceRequestShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/service_requests/$serviceRequestId",
)({
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { facilityId, locationId, serviceRequestId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/service_requests/$serviceRequestId",
  });
  return (
    <ServiceRequestShow
      facilityId={facilityId}
      locationId={locationId}
      serviceRequestId={serviceRequestId}
    />
  );
}
