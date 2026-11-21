import { createFileRoute, useParams } from "@tanstack/react-router";

import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";
import { valueSetEditorSearch } from "@/lib/router/search/admin";
import { valueSetScopeForFacility } from "@/types/valueSet/valueSet";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/valuesets/$id/edit",
)({
  validateSearch: valueSetEditorSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/valuesets/$id/edit",
  });
  return (
    <ValueSetEditor scope={valueSetScopeForFacility(facilityId)} id={id} />
  );
}
