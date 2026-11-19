import { createFileRoute, useParams } from "@tanstack/react-router";

import FacilityReferrals from "@/pages/Facility/referrals/FacilityReferrals";

export const Route = createFileRoute("/_app/facility/$facilityId/referrals")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/referrals",
  });
  return <FacilityReferrals facilityId={facilityId} />;
}
