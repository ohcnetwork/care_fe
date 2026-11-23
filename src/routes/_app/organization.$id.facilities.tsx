import { createFileRoute, useParams } from "@tanstack/react-router";

import { organizationFacilityListSearch } from "@/lib/router/search/organization";
import OrganizationFacilities from "@/pages/Organization/OrganizationFacilities";

export const Route = createFileRoute("/_app/organization/$id/facilities")({
  validateSearch: organizationFacilityListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/organization/$id/facilities" });
  return <OrganizationFacilities id={id} />;
}
