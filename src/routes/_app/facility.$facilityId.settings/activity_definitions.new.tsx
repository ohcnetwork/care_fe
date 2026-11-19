import { createFileRoute, useParams } from "@tanstack/react-router";

import ActivityDefinitionForm from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/activity_definitions/new",
  });
  return <ActivityDefinitionForm facilityId={facilityId} />;
}
