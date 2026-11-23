import { createFileRoute, useParams } from "@tanstack/react-router";

import { referralListSearch } from "@/lib/router/search/referral";
import OrganizationReferrals from "@/pages/Organization/OrganizationReferrals";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/referrals",
)({
  validateSearch: referralListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = useParams({
    from: "/_app/organization/$navOrganizationId/children/$id/referrals",
  });
  return (
    <OrganizationReferrals id={id} navOrganizationId={navOrganizationId} />
  );
}
