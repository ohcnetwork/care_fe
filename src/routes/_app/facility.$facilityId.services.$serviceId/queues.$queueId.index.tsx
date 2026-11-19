import { createFileRoute } from "@tanstack/react-router";
import { Redirect } from "raviger";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/queues/$queueId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId, queueId } = Route.useParams();
  return (
    <Redirect
      to={`/facility/${facilityId}/services/${serviceId}/queues/${queueId}/ongoing`}
    />
  );
}
