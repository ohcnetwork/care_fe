import { createFileRoute, useParams } from "@tanstack/react-router";

import ObservationDefinitionForm from "@/pages/Facility/settings/observationDefinition/ObservationDefinitionForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/observation_definitions/$observationSlug/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, observationSlug } = useParams({
    from: "/_app/facility/$facilityId/settings/observation_definitions/$observationSlug/edit",
  });
  return (
    <ObservationDefinitionForm
      facilityId={facilityId}
      observationSlug={observationSlug}
    />
  );
}
