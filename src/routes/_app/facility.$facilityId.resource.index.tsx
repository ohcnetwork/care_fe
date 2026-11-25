import { createFileRoute, useParams } from "@tanstack/react-router";

import ResourceList from "@/components/Resource/ResourceList";
import { resourceListSearch } from "@/lib/router/search/resource";

export const Route = createFileRoute("/_app/facility/$facilityId/resource/")({
  validateSearch: resourceListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/resource/",
  });
  return <ResourceList facilityId={facilityId} />;
}
