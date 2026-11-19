import { createFileRoute } from "@tanstack/react-router";

import ActivityDefinitionForm from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <ActivityDefinitionForm facilityId={facilityId} />;
}
