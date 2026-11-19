import { createFileRoute } from "@tanstack/react-router";

import ResourceList from "@/components/Resource/ResourceList";

export const Route = createFileRoute("/_app/facility/$facilityId/resource/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <ResourceList facilityId={facilityId} />;
}
