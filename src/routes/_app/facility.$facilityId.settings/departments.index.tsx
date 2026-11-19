import { createFileRoute } from "@tanstack/react-router";

import FacilityOrganizationList from "@/pages/Facility/settings/organizations/FacilityOrganizationList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/departments/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <FacilityOrganizationList />;
}
