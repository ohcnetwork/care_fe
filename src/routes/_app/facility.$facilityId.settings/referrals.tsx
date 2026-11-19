import { createFileRoute, useParams } from "@tanstack/react-router";

import ReferralAvailabilitySettings from "@/pages/Facility/settings/referrals/ReferralAvailabilitySettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/referrals",
)({
  component: RouteComponent,
  staticData: { crumb: "referral_availability" },
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/referrals",
  });
  return <ReferralAvailabilitySettings facilityId={facilityId} />;
}
