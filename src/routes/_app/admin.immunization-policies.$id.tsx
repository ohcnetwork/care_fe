import { createFileRoute, useParams } from "@tanstack/react-router";

import ImmunizationPolicyForm from "@/pages/ImmunizationPolicies/ImmunizationPolicyForm";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export const Route = createFileRoute("/_app/admin/immunization-policies/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/immunization-policies/$id" });
  return <ImmunizationPolicyForm scope={immunizationPolicyScope()} id={id} />;
}
