import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

import ServiceRequestShow from "@/pages/Facility/services/serviceRequests/ServiceRequestShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/service_requests/$serviceRequestId",
)({
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { facilityId, serviceRequestId } = Route.useParams();
  return (
    <ServiceRequestShow
      facilityId={facilityId}
      serviceRequestId={serviceRequestId}
    />
  );
}
