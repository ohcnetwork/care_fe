import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationReferralAvailability from "@/pages/Organization/OrganizationReferralAvailability";

export const Route = createFileRoute(
  "/_app/responsibilities/$id/settings/referrals",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({
    from: "/_app/responsibilities/$id/settings/referrals",
  });
  return (
    <OrganizationReferralAvailability id={id} routeContext="responsibility" />
  );
}
