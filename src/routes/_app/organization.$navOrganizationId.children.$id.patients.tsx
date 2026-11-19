import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationPatients from "@/pages/Organization/OrganizationPatients";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/patients",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = useParams({
    from: "/_app/organization/$navOrganizationId/children/$id/patients",
  });
  return <OrganizationPatients id={id} navOrganizationId={navOrganizationId} />;
}
