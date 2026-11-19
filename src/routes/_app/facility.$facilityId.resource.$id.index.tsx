import { createFileRoute } from "@tanstack/react-router";

import ResourceDetails from "@/components/Resource/ResourceDetails";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/resource/$id/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return <ResourceDetails facilityId={facilityId} id={id} />;
}
