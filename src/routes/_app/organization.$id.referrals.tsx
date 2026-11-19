import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationReferrals from "@/pages/Organization/OrganizationReferrals";

export const Route = createFileRoute("/_app/organization/$id/referrals")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/organization/$id/referrals" });
  return <OrganizationReferrals id={id} />;
}
