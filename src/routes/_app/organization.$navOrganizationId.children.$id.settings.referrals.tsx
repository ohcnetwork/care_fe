import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationReferralAvailability from "@/pages/Organization/OrganizationReferralAvailability";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/settings/referrals",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = useParams({
    from: "/_app/organization/$navOrganizationId/children/$id/settings/referrals",
  });
  return (
    <OrganizationReferralAvailability
      id={id}
      navOrganizationId={navOrganizationId}
    />
  );
}
