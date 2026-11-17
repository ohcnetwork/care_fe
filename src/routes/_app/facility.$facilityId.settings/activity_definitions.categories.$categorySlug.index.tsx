import { createFileRoute } from "@tanstack/react-router";

import ActivityDefinitionList from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions/categories/$categorySlug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, categorySlug } = Route.useParams();
  return (
    <ActivityDefinitionList
      facilityId={facilityId}
      categorySlug={categorySlug}
    />
  );
}
