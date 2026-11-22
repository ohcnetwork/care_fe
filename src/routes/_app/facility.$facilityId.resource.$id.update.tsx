import { createFileRoute, useParams } from "@tanstack/react-router";

import ResourceForm from "@/components/Resource/ResourceForm";
import { resourceFormSearch } from "@/lib/router/search/resource";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/resource/$id/update",
)({
  validateSearch: resourceFormSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/resource/$id/update",
  });
  return <ResourceForm facilityId={facilityId} id={id} />;
}
