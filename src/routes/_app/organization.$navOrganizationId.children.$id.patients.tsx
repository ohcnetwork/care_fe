import { createFileRoute } from "@tanstack/react-router";

import OrganizationPatients from "@/pages/Organization/OrganizationPatients";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/patients",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = Route.useParams();
  return <OrganizationPatients id={id} navOrganizationId={navOrganizationId} />;
}
