import { createFileRoute } from "@tanstack/react-router";

import ResourceForm from "@/components/Resource/ResourceForm";

export const Route = createFileRoute("/_app/facility/$facilityId/resource/new")(
  {
    component: RouteComponent,
  },
);

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <ResourceForm facilityId={facilityId} />;
}
