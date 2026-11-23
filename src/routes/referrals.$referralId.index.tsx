import { createFileRoute, useParams } from "@tanstack/react-router";

import { staffOrPatient } from "@/lib/router/auth";
import { referralContextSearch } from "@/lib/router/search/referral";
import { ReferralDetailsPage } from "@/pages/Referrals/ReferralDetailsPage";

/** Shared URL: the same page for staff and patients, in their chrome. */
export const Route = createFileRoute("/referrals/$referralId/")({
  beforeLoad: staffOrPatient,
  staticData: { sidebar: false },
  validateSearch: referralContextSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { referralId } = useParams({ from: "/referrals/$referralId/" });
  return <ReferralDetailsPage key={referralId} referralId={referralId} />;
}
