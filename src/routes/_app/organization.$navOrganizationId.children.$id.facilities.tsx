import { createFileRoute, useParams } from "@tanstack/react-router";

import { organizationFacilityListSearch } from "@/lib/router/search/organization";
import OrganizationFacilities from "@/pages/Organization/OrganizationFacilities";

export const Route = createFileRoute(
  "/_app/organization/$navOrganizationId/children/$id/facilities",
)({
  validateSearch: organizationFacilityListSearch,
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
