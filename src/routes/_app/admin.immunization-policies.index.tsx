import { createFileRoute } from "@tanstack/react-router";

import ImmunizationPolicyList from "@/pages/ImmunizationPolicies/ImmunizationPolicyList";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export const Route = createFileRoute("/_app/admin/immunization-policies/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ImmunizationPolicyList scope={immunizationPolicyScope()} />;
}
