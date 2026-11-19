import { createFileRoute } from "@tanstack/react-router";

import OrganizationReferrals from "@/pages/Organization/OrganizationReferrals";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/referrals",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = Route.useParams();
  return (
    <OrganizationReferrals id={id} navOrganizationId={navOrganizationId} />
  );
}
