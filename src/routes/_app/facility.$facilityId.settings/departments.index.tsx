import { createFileRoute } from "@tanstack/react-router";

import { facilityOrganizationListSearch } from "@/lib/router/search/settings";
import FacilityOrganizationList from "@/pages/Facility/settings/organizations/FacilityOrganizationList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/departments/",
)({
  validateSearch: facilityOrganizationListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <FacilityOrganizationList />;
}
