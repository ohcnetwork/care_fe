import { createFileRoute, useParams } from "@tanstack/react-router";

import ActivityDefinitionForm from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions/$activityDefinitionSlug/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, activityDefinitionSlug } = useParams({
    from: "/_app/facility/$facilityId/settings/activity_definitions/$activityDefinitionSlug/edit",
  });
  return (
    <ActivityDefinitionForm
      facilityId={facilityId}
      activityDefinitionSlug={activityDefinitionSlug}
    />
  );
}
