import { createFileRoute } from "@tanstack/react-router";

import FacilityReferrals from "@/pages/Facility/referrals/FacilityReferrals";

export const Route = createFileRoute("/_app/facility/$facilityId/referrals")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <FacilityReferrals facilityId={facilityId} />;
}
