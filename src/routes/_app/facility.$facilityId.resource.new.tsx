import { createFileRoute, useParams } from "@tanstack/react-router";

import ResourceForm from "@/components/Resource/ResourceForm";
import { resourceFormSearch } from "@/lib/router/search/resource";

export const Route = createFileRoute("/_app/facility/$facilityId/resource/new")(
  {
    validateSearch: resourceFormSearch,
    component: RouteComponent,
  },
);

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/resource/new",
  });
  return <ResourceForm facilityId={facilityId} />;
}
