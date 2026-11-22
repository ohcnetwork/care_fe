import { createFileRoute } from "@tanstack/react-router";

import { immunizationPolicyListSearch } from "@/lib/router/search/admin";
import ImmunizationPolicyList from "@/pages/ImmunizationPolicies/ImmunizationPolicyList";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export const Route = createFileRoute("/_app/admin/immunization-policies/")({
  validateSearch: immunizationPolicyListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <ImmunizationPolicyList scope={immunizationPolicyScope()} />;
}
