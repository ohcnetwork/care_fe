import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationFacilities from "@/pages/Organization/OrganizationFacilities";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/facilities",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { navOrganizationId, id } = useParams({
    from: "/_app/organization/$navOrganizationId/children/$id/facilities",
  });
  return (
    <OrganizationFacilities id={id} navOrganizationId={navOrganizationId} />
  );
}
