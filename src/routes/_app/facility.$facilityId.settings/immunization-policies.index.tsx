import { createFileRoute, useParams } from "@tanstack/react-router";

import ImmunizationPolicyList from "@/pages/ImmunizationPolicies/ImmunizationPolicyList";
import { immunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/immunization-policies/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/immunization-policies/",
  });
  return <ImmunizationPolicyList scope={immunizationPolicyScope(facilityId)} />;
}
