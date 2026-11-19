import { createFileRoute } from "@tanstack/react-router";

import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";

import { INSTANCE_VALUESET_SCOPE } from "@/types/valueSet/valueSet";

export const Route = createFileRoute("/_app/admin/valuesets/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ValueSetEditor scope={INSTANCE_VALUESET_SCOPE} />;
}
