import { createFileRoute } from "@tanstack/react-router";

import OrganizationReferralAvailability from "@/pages/Organization/OrganizationReferralAvailability";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/settings/referrals",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = Route.useParams();
  return (
    <OrganizationReferralAvailability
      id={id}
      navOrganizationId={navOrganizationId}
    />
  );
}
