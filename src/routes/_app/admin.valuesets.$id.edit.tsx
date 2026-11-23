import { createFileRoute, useParams } from "@tanstack/react-router";

import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";
import { valueSetEditorSearch } from "@/lib/router/search/admin";

import { INSTANCE_VALUESET_SCOPE } from "@/types/valueSet/valueSet";

export const Route = createFileRoute("/_app/admin/valuesets/$id/edit")({
  validateSearch: valueSetEditorSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/valuesets/$id/edit" });
  return <ValueSetEditor scope={INSTANCE_VALUESET_SCOPE} id={id} />;
}
