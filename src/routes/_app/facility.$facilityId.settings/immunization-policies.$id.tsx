import { createFileRoute } from "@tanstack/react-router";

import ImmunizationPolicyForm from "@/pages/ImmunizationPolicies/ImmunizationPolicyForm";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/immunization-policies/$id",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return (
    <ImmunizationPolicyForm
      scope={immunizationPolicyScope(facilityId)}
      id={id}
    />
  );
}
