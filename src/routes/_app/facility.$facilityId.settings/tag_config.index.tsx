import { createFileRoute, useParams } from "@tanstack/react-router";

import TagConfigList from "@/pages/Admin/TagConfig/TagConfigList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/tag_config/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/tag_config/",
  });
  return <TagConfigList facilityId={facilityId} />;
}
