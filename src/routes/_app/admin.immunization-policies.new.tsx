import { createFileRoute } from "@tanstack/react-router";

import ImmunizationPolicyForm from "@/pages/ImmunizationPolicies/ImmunizationPolicyForm";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export const Route = createFileRoute("/_app/admin/immunization-policies/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ImmunizationPolicyForm scope={immunizationPolicyScope()} />;
}
