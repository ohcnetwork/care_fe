import { createFileRoute } from "@tanstack/react-router";

import OrganizationReferrals from "@/pages/Organization/OrganizationReferrals";

export const Route = createFileRoute("/_app/organization/$id/referrals")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <OrganizationReferrals id={id} />;
}
