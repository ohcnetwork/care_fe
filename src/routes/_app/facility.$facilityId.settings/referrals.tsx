import { createFileRoute } from "@tanstack/react-router";

import ReferralAvailabilitySettings from "@/pages/Facility/settings/referrals/ReferralAvailabilitySettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/referrals",
)({
  component: RouteComponent,
  staticData: { crumb: "referral_availability" },
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <ReferralAvailabilitySettings facilityId={facilityId} />;
}
