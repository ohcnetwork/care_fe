import { createFileRoute, useParams } from "@tanstack/react-router";

import { ValueSetList } from "@/components/ValueSet/ValueSetList";
import { valueSetScopeForFacility } from "@/types/valueSet/valueSet";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/valuesets/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/valuesets/",
  });
  return <ValueSetList scope={valueSetScopeForFacility(facilityId)} />;
}
