import { createFileRoute } from "@tanstack/react-router";

import TagConfigList from "@/pages/Admin/TagConfig/TagConfigList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/tag_config/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <TagConfigList facilityId={facilityId} />;
}
