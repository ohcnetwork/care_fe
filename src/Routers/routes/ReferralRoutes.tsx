import { AppRoutes } from "@/Routers/AppRouter";
import { ReferralDetailsPage } from "@/pages/Referrals/ReferralDetailsPage";
import { ReferralResponsePage } from "@/pages/Referrals/ReferralResponsePage";

const ReferralRoutes: AppRoutes = {
  "/referrals/:referralId/respond": ({ referralId }) => (
    <ReferralResponsePage key={referralId} referralId={referralId} />
  ),
  "/referrals/:referralId": ({ referralId }) => (
    <ReferralDetailsPage key={referralId} referralId={referralId} />
  ),
};

export default ReferralRoutes;
