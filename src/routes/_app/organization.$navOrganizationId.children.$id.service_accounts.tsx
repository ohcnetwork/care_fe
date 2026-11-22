import { createFileRoute, useParams } from "@tanstack/react-router";

import { organizationUserListSearch } from "@/lib/router/search/organization";
import OrganizationUsers from "@/pages/Organization/OrganizationUsers";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/service_accounts",
)({
  validateSearch: organizationUserListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = useParams({
    from: "/_app/organization/$navOrganizationId/children/$id/service_accounts",
  });
  return (
    <OrganizationUsers
      id={id}
      isServiceAccount={true}
      navOrganizationId={navOrganizationId}
    />
  );
}
