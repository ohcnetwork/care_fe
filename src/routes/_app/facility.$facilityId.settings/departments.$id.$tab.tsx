import { createFileRoute } from "@tanstack/react-router";

import FacilityOrganizationList from "@/pages/Facility/settings/organizations/FacilityOrganizationList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/departments/$id/$tab",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id, tab } = Route.useParams();
  return <FacilityOrganizationList organizationId={id} currentTab={tab} />;
}
