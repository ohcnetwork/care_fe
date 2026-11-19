import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationUsers from "@/pages/Organization/OrganizationUsers";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/service_accounts",
)({
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
