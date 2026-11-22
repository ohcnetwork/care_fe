import { createFileRoute, useParams } from "@tanstack/react-router";

import ResourceDetails from "@/components/Resource/ResourceDetails";
import { resourceCommentListSearch } from "@/lib/router/search/resource";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/resource/$id/",
)({
  validateSearch: resourceCommentListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/resource/$id/",
  });
  return <ResourceDetails facilityId={facilityId} id={id} />;
}
