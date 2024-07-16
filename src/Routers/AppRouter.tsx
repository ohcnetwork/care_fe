import { useRedirect, useRoutes, usePath, Redirect } from "raviger";
import { useState, useEffect } from "react";

import ShowPushNotification from "../Components/Notifications/ShowPushNotification";
import { NoticeBoard } from "../Components/Notifications/NoticeBoard";
import Error404 from "../Components/ErrorPages/404";
import {
  DesktopSidebar,
  MobileSidebar,
  SIDEBAR_SHRINK_PREFERENCE_KEY,
  SidebarShrinkContext,
} from "../Components/Common/Sidebar/Sidebar";
import { BLACKLISTED_PATHS } from "../Common/constants";
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
import { DetailRoute } from "./types";
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
  const { main_logo, enable_hcx } = useConfig();

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
  const path = usePath();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
    let flag = false;
    if (path) {
      BLACKLISTED_PATHS.forEach((regex: RegExp) => {
        flag = flag || regex.test(path);
      });
      if (!flag) {
        const pageContainer = window.document.getElementById("pages");
        pageContainer?.scroll(0, 0);
      }
    }
  }, [path]);

  const [shrinked, setShrinked] = useState(
    localStorage.getItem(SIDEBAR_SHRINK_PREFERENCE_KEY) === "true",
  );

  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_SHRINK_PREFERENCE_KEY,
      shrinked ? "true" : "false",
    );
  }, [shrinked]);

  return (
    <SidebarShrinkContext.Provider value={{ shrinked, setShrinked }}>
      <div className="absolute inset-0 flex h-screen overflow-hidden bg-secondary-100 print:overflow-visible">
        <>
          <div className="block md:hidden">
            <MobileSidebar open={sidebarOpen} setOpen={setSidebarOpen} />{" "}
          </div>
          <div className="hidden md:block">
            <DesktopSidebar />
          </div>
        </>

        <div className="flex w-full flex-1 flex-col overflow-hidden print:overflow-visible">
          <div className="relative z-10 flex h-16 shrink-0 bg-white shadow md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="border-r border-secondary-200 px-4 text-secondary-500 focus:bg-secondary-100 focus:text-secondary-600 focus:outline-none md:hidden"
              aria-label="Open sidebar"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
            <a
              href="/"
              className="flex h-full w-full items-center px-4 md:hidden"
            >
              <img
                className="h-6 w-auto"
                src={main_logo.dark}
                alt="care logo"
              />
            </a>
          </div>

          <main
            id="pages"
            className="flex-1 overflow-y-scroll pb-4 focus:outline-none md:py-0"
          >
            <div className="max-w-8xl mx-auto p-3">{pages}</div>
          </main>
        </div>
      </div>
    </SidebarShrinkContext.Provider>
  );
}
