import { createFileRoute } from "@tanstack/react-router";

import SpecimenDefinitionForm from "@/pages/Facility/settings/specimen-definitions/SpecimenDefinitionForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/specimen_definitions/$specimenSlug/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, specimenSlug } = Route.useParams();
  return (
    <SpecimenDefinitionForm
      facilityId={facilityId}
      specimenSlug={specimenSlug}
    />
  );
}
