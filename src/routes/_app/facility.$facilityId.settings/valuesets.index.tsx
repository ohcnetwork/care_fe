import { createFileRoute } from "@tanstack/react-router";

import { ValueSetList } from "@/components/ValueSet/ValueSetList";
import { valueSetScopeForFacility } from "@/types/valueSet/valueSet";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/valuesets/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <ValueSetList scope={valueSetScopeForFacility(facilityId)} />;
}
