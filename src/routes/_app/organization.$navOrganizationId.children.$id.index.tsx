import { createFileRoute } from "@tanstack/react-router";

import OrganizationView from "@/pages/Organization/OrganizationView";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = Route.useParams();
  return <OrganizationView id={id} navOrganizationId={navOrganizationId} />;
}
