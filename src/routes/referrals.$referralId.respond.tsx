import { createFileRoute, useParams } from "@tanstack/react-router";

import { staffOrPatient } from "@/lib/router/auth";
import { referralContextSearch } from "@/lib/router/search/referral";
import { ReferralResponsePage } from "@/pages/Referrals/ReferralResponsePage";

/** Shared URL: the same page for staff and patients, in their chrome. */
export const Route = createFileRoute("/referrals/$referralId/respond")({
  beforeLoad: staffOrPatient,
  staticData: { sidebar: false },
  validateSearch: referralContextSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { referralId } = useParams({ from: "/referrals/$referralId/respond" });
  return <ReferralResponsePage key={referralId} referralId={referralId} />;
}
