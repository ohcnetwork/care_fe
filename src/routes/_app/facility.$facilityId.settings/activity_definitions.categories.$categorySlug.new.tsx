import { createFileRoute, useParams } from "@tanstack/react-router";

import ActivityDefinitionForm from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions/categories/$categorySlug/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, categorySlug } = useParams({
    from: "/_app/facility/$facilityId/settings/activity_definitions/categories/$categorySlug/new",
  });
  return (
    <ActivityDefinitionForm
      facilityId={facilityId}
      categorySlug={categorySlug}
    />
  );
}
