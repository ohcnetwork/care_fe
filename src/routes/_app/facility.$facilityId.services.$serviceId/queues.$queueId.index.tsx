import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/queues/$queueId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId, queueId } = useParams({
    from: "/_app/facility/$facilityId/services/$serviceId/queues/$queueId/",
  });
  // Keep the query and the hash, as the old `Redirect` did.
  return (
    <Navigate
      to="/facility/$facilityId/services/$serviceId/queues/$queueId/ongoing"
      params={{ facilityId, serviceId, queueId }}
      search
      hash
      replace
    />
  );
}
