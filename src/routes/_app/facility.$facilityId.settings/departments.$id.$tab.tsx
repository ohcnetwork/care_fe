import { createFileRoute, useParams } from "@tanstack/react-router";

import { facilityOrganizationListSearch } from "@/lib/router/search/settings";
import FacilityOrganizationList from "@/pages/Facility/settings/organizations/FacilityOrganizationList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/departments/$id/$tab",
)({
  validateSearch: facilityOrganizationListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { id, tab } = useParams({
    from: "/_app/facility/$facilityId/settings/departments/$id/$tab",
  });
  return <FacilityOrganizationList organizationId={id} currentTab={tab} />;
}
