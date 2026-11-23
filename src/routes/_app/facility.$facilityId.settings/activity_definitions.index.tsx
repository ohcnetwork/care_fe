import { createFileRoute, useParams } from "@tanstack/react-router";

import { activityDefinitionsPageSearch } from "@/lib/router/search/settings";
import ActivityDefinitionList from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions/",
)({
  validateSearch: activityDefinitionsPageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/activity_definitions/",
  });
  return <ActivityDefinitionList facilityId={facilityId} />;
}
