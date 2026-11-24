import { createFileRoute, useParams } from "@tanstack/react-router";

import { organizationUserListSearch } from "@/lib/router/search/organization";
import OrganizationUsers from "@/pages/Organization/OrganizationUsers";

export const Route = createFileRoute("/_app/organization/$id/service_accounts")(
  {
    validateSearch: organizationUserListSearch,
    component: RouteComponent,
  },
);

function RouteComponent() {
  const { id } = useParams({ from: "/_app/organization/$id/service_accounts" });
  return <OrganizationUsers id={id} isServiceAccount={true} />;
}
