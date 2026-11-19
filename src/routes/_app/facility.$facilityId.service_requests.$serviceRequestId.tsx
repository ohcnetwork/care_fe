import { createFileRoute, useParams } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

import ServiceRequestShow from "@/pages/Facility/services/serviceRequests/ServiceRequestShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/service_requests/$serviceRequestId",
)({
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { facilityId, serviceRequestId } = useParams({
    from: "/_app/facility/$facilityId/service_requests/$serviceRequestId",
  });
  return (
    <ServiceRequestShow
      facilityId={facilityId}
      serviceRequestId={serviceRequestId}
    />
  );
}
