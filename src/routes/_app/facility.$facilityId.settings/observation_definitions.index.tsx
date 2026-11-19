import { createFileRoute, useParams } from "@tanstack/react-router";

import ObservationDefinitionList from "@/pages/Facility/settings/observationDefinition/ObservationDefinitionList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/observation_definitions/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/observation_definitions/",
  });
  return <ObservationDefinitionList facilityId={facilityId} />;
}
