import { createFileRoute, useParams } from "@tanstack/react-router";

import ActivityDefinitionView from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionView";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions/$activityDefinitionSlug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, activityDefinitionSlug } = useParams({
    from: "/_app/facility/$facilityId/settings/activity_definitions/$activityDefinitionSlug/",
  });
  return (
    <ActivityDefinitionView
      facilityId={facilityId}
      activityDefinitionSlug={activityDefinitionSlug}
    />
  );
}
