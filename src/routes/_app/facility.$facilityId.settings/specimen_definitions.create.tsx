import { createFileRoute, useParams } from "@tanstack/react-router";

import SpecimenDefinitionForm from "@/pages/Facility/settings/specimen-definitions/SpecimenDefinitionForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/specimen_definitions/create",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/specimen_definitions/create",
  });
  return <SpecimenDefinitionForm facilityId={facilityId} />;
}
