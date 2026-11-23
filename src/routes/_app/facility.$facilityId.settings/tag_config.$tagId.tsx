import { createFileRoute, useParams } from "@tanstack/react-router";

import TagConfigView from "@/pages/Admin/TagConfig/TagConfigView";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/tag_config/$tagId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, tagId } = useParams({
    from: "/_app/facility/$facilityId/settings/tag_config/$tagId",
  });
  return <TagConfigView facilityId={facilityId} tagId={tagId} />;
}
