import { useRedirect, useRoutes, Redirect } from "raviger";
import ShowPushNotification from "../Components/Notifications/ShowPushNotification";
import { NoticeBoard } from "../Components/Notifications/NoticeBoard";
import Error404 from "../Components/ErrorPages/404";
import useConfig from "../Common/hooks/useConfig";
import SessionExpired from "../Components/ErrorPages/SessionExpired";
import HealthInformation from "../Components/ABDM/HealthInformation";
import ABDMFacilityRecords from "../Components/ABDM/ABDMFacilityRecords";

import UserRoutes from "./routes/UserRoutes";
import PatientRoutes from "./routes/PatientRoutes";
import SampleRoutes from "./routes/SampleRoutes";
import FacilityRoutes from "./routes/FacilityRoutes";
import ConsultationRoutes from "./routes/ConsultationRoutes";
import HCXRoutes from "./routes/HCXRoutes";
import ShiftingRoutes from "./routes/ShiftingRoutes";
import AssetRoutes from "./routes/AssetRoutes";
import ResourceRoutes from "./routes/ResourceRoutes";
import ExternalResultRoutes from "./routes/ExternalResultRoutes";
import DetailRoute from "./types/DetailRoute";
import useAuthUser from "../Common/hooks/useAuthUser";

const Routes = {
  "/": () => <Redirect to="/facility" />,

  ...AssetRoutes,
  ...ConsultationRoutes,
  ...FacilityRoutes,
  ...PatientRoutes,
  ...ResourceRoutes,
  ...SampleRoutes,
  ...ShiftingRoutes,
  ...UserRoutes,

  "/notifications/:id": ({ id }: DetailRoute) => (
    <ShowPushNotification id={id} />
  ),
  "/notice_board": () => <NoticeBoard />,

  "/abdm/health-information/:id": ({ id }: { id: string }) => (
    <HealthInformation artefactId={id} />
  ),
  "/facility/:facilityId/abdm": ({ facilityId }: any) => (
    <ABDMFacilityRecords facilityId={facilityId} />
  ),

  "/session-expired": () => <SessionExpired />,
  "/not-found": () => <Error404 />,
};

export default function AppRouter() {
  const authUser = useAuthUser();
  const { enable_hcx } = useConfig();

  let routes = Routes;

  if (enable_hcx) {
    routes = { ...routes, ...HCXRoutes };
  }

  if (
    !["Nurse", "NurseReadOnly", "Staff", "StaffReadOnly"].includes(
      authUser.user_type,
    )
  ) {
    routes = { ...routes, ...ExternalResultRoutes };
  }

  useRedirect("/user", "/users");
  const pages = useRoutes(routes) || <Error404 />;
  return pages;
}
