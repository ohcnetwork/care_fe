import { createFileRoute } from "@tanstack/react-router";

import { staffOrPatient } from "@/lib/router/auth";
import { ReferralDetailsPage } from "@/pages/Referrals/ReferralDetailsPage";

/** Shared URL: the same page for staff and patients, in their chrome. */
export const Route = createFileRoute("/referrals/$referralId/")({
  beforeLoad: staffOrPatient,
  staticData: { sidebar: false },
  component: RouteComponent,
});

function RouteComponent() {
  const { referralId } = Route.useParams();
  return <ReferralDetailsPage key={referralId} referralId={referralId} />;
}
