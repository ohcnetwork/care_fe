import { createFileRoute, useParams } from "@tanstack/react-router";

import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";
import { valueSetScopeForFacility } from "@/types/valueSet/valueSet";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/valuesets/create",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/valuesets/create",
  });
  return <ValueSetEditor scope={valueSetScopeForFacility(facilityId)} />;
}
