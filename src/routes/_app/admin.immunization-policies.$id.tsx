import { createFileRoute } from "@tanstack/react-router";

import ImmunizationPolicyForm from "@/pages/ImmunizationPolicies/ImmunizationPolicyForm";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export const Route = createFileRoute("/_app/admin/immunization-policies/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <ImmunizationPolicyForm scope={immunizationPolicyScope()} id={id} />;
}
