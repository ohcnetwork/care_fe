import { createFileRoute } from "@tanstack/react-router";

import ActivityDefinitionView from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionView";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions/$activityDefinitionSlug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, activityDefinitionSlug } = Route.useParams();
  return (
    <ActivityDefinitionView
      facilityId={facilityId}
      activityDefinitionSlug={activityDefinitionSlug}
    />
  );
}
