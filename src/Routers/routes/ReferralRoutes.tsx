import { AppRoutes } from "@/Routers/AppRouter";
import { lazyPage } from "@/Routers/lazyPage";

const ReferralDetailsPage = lazyPage(
  () => import("@/pages/Referrals/ReferralDetailsPage"),
  "ReferralDetailsPage",
);
const ReferralResponsePage = lazyPage(
  () => import("@/pages/Referrals/ReferralResponsePage"),
  "ReferralResponsePage",
);

const ReferralRoutes: AppRoutes = {
  "/referrals/:referralId/respond": ({ referralId }) => (
    <ReferralResponsePage key={referralId} referralId={referralId} />
  ),
  "/referrals/:referralId": ({ referralId }) => (
    <ReferralDetailsPage key={referralId} referralId={referralId} />
  ),
};

export default ReferralRoutes;
