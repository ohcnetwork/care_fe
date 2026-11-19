import { createFileRoute, useParams } from "@tanstack/react-router";
import { Redirect } from "raviger";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/queues/$queueId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId, queueId } = useParams({
    from: "/_app/facility/$facilityId/services/$serviceId/queues/$queueId/",
  });
  return (
    <Redirect
      to={`/facility/${facilityId}/services/${serviceId}/queues/${queueId}/ongoing`}
    />
  );
}
