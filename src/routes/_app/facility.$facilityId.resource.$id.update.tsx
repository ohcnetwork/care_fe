import { createFileRoute } from "@tanstack/react-router";

import ResourceForm from "@/components/Resource/ResourceForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/resource/$id/update",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return <ResourceForm facilityId={facilityId} id={id} />;
}
