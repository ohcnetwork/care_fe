import { createFileRoute } from "@tanstack/react-router";

import TagConfigView from "@/pages/Admin/TagConfig/TagConfigView";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/tag_config/$tagId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, tagId } = Route.useParams();
  return <TagConfigView facilityId={facilityId} tagId={tagId} />;
}
