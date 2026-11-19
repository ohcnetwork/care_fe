import { createFileRoute } from "@tanstack/react-router";

import { SpecimenDefinitionDetail } from "@/pages/Facility/settings/specimen-definitions/SpecimenDefinitionDetail";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/specimen_definitions/$specimenSlug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, specimenSlug } = Route.useParams();
  return (
    <SpecimenDefinitionDetail
      facilityId={facilityId}
      specimenSlug={specimenSlug}
    />
  );
}
