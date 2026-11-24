import { createFileRoute } from "@tanstack/react-router";

import { ValueSetList } from "@/components/ValueSet/ValueSetList";
import { valueSetListSearch } from "@/lib/router/search/admin";

import { INSTANCE_VALUESET_SCOPE } from "@/types/valueSet/valueSet";

export const Route = createFileRoute("/_app/admin/valuesets/")({
  validateSearch: valueSetListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <ValueSetList scope={INSTANCE_VALUESET_SCOPE} />;
}
