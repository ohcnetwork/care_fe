import { createFileRoute, useParams } from "@tanstack/react-router";

import ObservationDefinitionForm from "@/pages/Facility/settings/observationDefinition/ObservationDefinitionForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/observation_definitions/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/observation_definitions/new",
  });
  return <ObservationDefinitionForm facilityId={facilityId} />;
}
