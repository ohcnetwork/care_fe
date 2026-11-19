import { createFileRoute } from "@tanstack/react-router";

import OrganizationReferralAvailability from "@/pages/Organization/OrganizationReferralAvailability";

export const Route = createFileRoute(
  "/_app/responsibilities/$id/settings/referrals",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <OrganizationReferralAvailability id={id} routeContext="responsibility" />
  );
}
