import careConfig from "@careConfig";
import { Redirect, usePath, useRedirect, useRoutes } from "raviger";
import { useEffect, useState } from "react";

import IconIndex from "@/CAREUI/icons/Index";

import {
  DesktopSidebar,
  MobileSidebar,
  SIDEBAR_SHRINK_PREFERENCE_KEY,
  SidebarShrinkContext,
} from "@/components/Common/Sidebar/Sidebar";
import Error404 from "@/components/ErrorPages/404";
import SessionExpired from "@/components/ErrorPages/SessionExpired";
import { NoticeBoard } from "@/components/Notifications/NoticeBoard";
import ShowPushNotification from "@/components/Notifications/ShowPushNotification";

import { usePluginRoutes } from "@/hooks/useCareApps";

import { BLACKLISTED_PATHS } from "@/common/constants";

import AssetRoutes from "@/Routers/routes/AssetRoutes";
import ConsultationRoutes from "@/Routers/routes/ConsultationRoutes";
import FacilityRoutes from "@/Routers/routes/FacilityRoutes";
import PatientRoutes from "@/Routers/routes/PatientRoutes";
import ResourceRoutes from "@/Routers/routes/ResourceRoutes";
import SampleRoutes from "@/Routers/routes/SampleRoutes";
import ShiftingRoutes from "@/Routers/routes/ShiftingRoutes";
import UserRoutes from "@/Routers/routes/UserRoutes";

export type RouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof RouteParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : Record<string, never>;

export type RouteFunction<T extends string> = (
  params: RouteParams<T>,
) => JSX.Element;

export type AppRoutes = {
  [K in string]: RouteFunction<K>;
};

const Routes: AppRoutes = {
  "/": () => <Redirect to="/facility" />,

  ...AssetRoutes,
  ...ConsultationRoutes,
  ...FacilityRoutes,
  ...PatientRoutes,
  ...ResourceRoutes,
  ...SampleRoutes,
  ...ShiftingRoutes,
  ...UserRoutes,

  "/notifications/:id": ({ id }) => <ShowPushNotification id={id} />,
  "/notice_board": () => <NoticeBoard />,

  "/session-expired": () => <SessionExpired />,
  "/not-found": () => <Error404 />,
  "/icons": () => <IconIndex />,

  // Only include the icon route in development environment
  ...(import.meta.env.PROD ? { "/icons": () => <IconIndex /> } : {}),
};

export default function AppRouter() {
  const pluginRoutes = usePluginRoutes();

  let routes = Routes;

  useRedirect("/user", "/users");

  // Merge in Plugin Routes
  routes = {
    ...pluginRoutes,
    ...routes,
  };

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
                className="h-8 w-auto"
                src={careConfig.mainLogo?.dark}
                alt="care logo"
              />
            </a>
          </div>

          <main
            id="pages"
            className="flex-1 overflow-y-scroll bg-gray-100 pb-4 focus:outline-none md:py-0"
          >
            <div
              className="max-w-8xl mx-auto mt-4 min-h-[96vh] rounded-lg border bg-gray-50 p-3 shadow"
              data-cui-page
            >
              {pages}
            </div>
          </main>
        </div>
      </div>
    </SidebarShrinkContext.Provider>
  );
}
