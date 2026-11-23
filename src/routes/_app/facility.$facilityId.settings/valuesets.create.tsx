import { createFileRoute, useParams } from "@tanstack/react-router";

import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";
import { valueSetEditorSearch } from "@/lib/router/search/admin";
import { valueSetScopeForFacility } from "@/types/valueSet/valueSet";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/valuesets/create",
)({
  validateSearch: valueSetEditorSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/valuesets/create",
  });
  return <ValueSetEditor scope={valueSetScopeForFacility(facilityId)} />;
}
