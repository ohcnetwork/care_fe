import { createFileRoute, useParams } from "@tanstack/react-router";

import ImmunizationPolicyForm from "@/pages/ImmunizationPolicies/ImmunizationPolicyForm";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/immunization-policies/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/immunization-policies/new",
  });
  return <ImmunizationPolicyForm scope={immunizationPolicyScope(facilityId)} />;
}
