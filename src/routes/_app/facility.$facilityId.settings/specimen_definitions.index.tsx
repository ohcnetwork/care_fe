import { createFileRoute, useParams } from "@tanstack/react-router";

import { specimenDefinitionListSearch } from "@/lib/router/search/settings";
import { SpecimenDefinitionsList } from "@/pages/Facility/settings/specimen-definitions/SpecimenDefinitionsList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/specimen_definitions/",
)({
  validateSearch: specimenDefinitionListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/specimen_definitions/",
  });
  return <SpecimenDefinitionsList facilityId={facilityId} />;
}
