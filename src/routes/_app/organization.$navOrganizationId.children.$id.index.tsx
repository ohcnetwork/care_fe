import { createFileRoute, useParams } from "@tanstack/react-router";

import { organizationViewSearch } from "@/lib/router/search/organization";
import OrganizationView from "@/pages/Organization/OrganizationView";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/",
)({
  validateSearch: organizationViewSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = useParams({
    from: "/_app/organization/$navOrganizationId/children/$id/",
  });
  return <OrganizationView id={id} navOrganizationId={navOrganizationId} />;
}
