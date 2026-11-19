import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationUsers from "@/pages/Organization/OrganizationUsers";

export const Route = createFileRoute("/_app/organization/$id/service_accounts")(
  {
    component: RouteComponent,
  },
);

function RouteComponent() {
  const { id } = useParams({ from: "/_app/organization/$id/service_accounts" });
  return <OrganizationUsers id={id} isServiceAccount={true} />;
}
