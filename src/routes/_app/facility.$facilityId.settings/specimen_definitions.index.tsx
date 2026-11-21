import { createFileRoute, useParams } from "@tanstack/react-router";

import { SpecimenDefinitionsList } from "@/pages/Facility/settings/specimen-definitions/SpecimenDefinitionsList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/specimen_definitions/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/specimen_definitions/",
  });
  return <SpecimenDefinitionsList facilityId={facilityId} />;
}
