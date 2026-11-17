import { createFileRoute } from "@tanstack/react-router";

import ActivityDefinitionForm from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions/$activityDefinitionSlug/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, activityDefinitionSlug } = Route.useParams();
  return (
    <ActivityDefinitionForm
      facilityId={facilityId}
      activityDefinitionSlug={activityDefinitionSlug}
    />
  );
}
