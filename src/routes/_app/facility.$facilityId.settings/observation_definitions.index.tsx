import { createFileRoute } from "@tanstack/react-router";

import ObservationDefinitionList from "@/pages/Facility/settings/observationDefinition/ObservationDefinitionList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/observation_definitions/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <ObservationDefinitionList facilityId={facilityId} />;
}
