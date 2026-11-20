import { createFileRoute } from "@tanstack/react-router";

import { ValueSetList } from "@/components/ValueSet/ValueSetList";

import { INSTANCE_VALUESET_SCOPE } from "@/types/valueSet/valueSet";

export const Route = createFileRoute("/_app/admin/valuesets/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ValueSetList scope={INSTANCE_VALUESET_SCOPE} />;
}
