import { createFileRoute, useParams } from "@tanstack/react-router";

import ObservationDefinitionView from "@/pages/Facility/settings/observationDefinition/ObservationDefinitionView";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/observation_definitions/$observationSlug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, observationSlug } = useParams({
    from: "/_app/facility/$facilityId/settings/observation_definitions/$observationSlug/",
  });
  return (
    <ObservationDefinitionView
      facilityId={facilityId}
      observationSlug={observationSlug}
    />
  );
}
