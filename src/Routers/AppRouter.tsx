import careConfig from "@careConfig";
import { Redirect, useRedirect, useRoutes } from "raviger";

import IconIndex from "@/CAREUI/icons/Index";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/sidebar/app-sidebar";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import SessionExpired from "@/components/ErrorPages/SessionExpired";

import useAuthUser from "@/hooks/useAuthUser";
import { usePluginRoutes } from "@/hooks/useCareApps";

import ConsultationRoutes from "@/Routers/routes/ConsultationRoutes";
import FacilityRoutes from "@/Routers/routes/FacilityRoutes";
import PatientRoutes from "@/Routers/routes/PatientRoutes";
import ResourceRoutes from "@/Routers/routes/ResourceRoutes";
import ScheduleRoutes from "@/Routers/routes/ScheduleRoutes";
import UserRoutes from "@/Routers/routes/UserRoutes";
import { PermissionProvider } from "@/context/PermissionContext";
import { PlugConfigEdit } from "@/pages/Apps/PlugConfigEdit";
import { PlugConfigList } from "@/pages/Apps/PlugConfigList";
import UserDashboard from "@/pages/UserDashboard";

import OrganizationRoutes from "./routes/OrganizationRoutes";
import QuestionnaireRoutes from "./routes/questionnaireRoutes";

// List of paths where the sidebar should be hidden
const PATHS_WITHOUT_SIDEBAR = ["/", "/session-expired"];

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
  "/": () => <UserDashboard />,
  // ...AssetRoutes,
  ...ConsultationRoutes,
  ...FacilityRoutes,
  ...PatientRoutes,
  ...ResourceRoutes,
  ...ScheduleRoutes,
  ...UserRoutes,
  ...OrganizationRoutes,
  ...QuestionnaireRoutes,

  "/session-expired": () => <SessionExpired />,
  "/not-found": () => <ErrorPage />,
  "/icons": () => <IconIndex />,

  // Only include the icon route in development environment
  ...(import.meta.env.PROD ? { "/icons": () => <IconIndex /> } : {}),

  "/apps": () => <PlugConfigList />,
  "/apps/plug-configs/:slug": ({ slug }) => <PlugConfigEdit slug={slug} />,
  "/login": () => <Redirect to="/" />,
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

  const pages = useRoutes(routes) || <ErrorPage />;
  const user = useAuthUser();
  const currentPath = window.location.pathname;
  const shouldShowSidebar = !PATHS_WITHOUT_SIDEBAR.includes(currentPath);

  return (
    <SidebarProvider>
      <PermissionProvider
        userPermissions={user?.permissions || []}
        isSuperAdmin={user?.is_superuser || false}
      >
        {shouldShowSidebar && <AppSidebar user={user} />}
        <main
          id="pages"
          className="flex-1 overflow-y-auto bg-gray-100 focus:outline-none md:pb-2 md:pr-2"
        >
          <div className="relative z-10 flex h-16 shrink-0 bg-white shadow md:hidden">
            <div className="flex items-center">
              {shouldShowSidebar && <SidebarTrigger />}
            </div>
            <a className="flex h-full w-full items-center px-4 md:hidden">
              <img
                className="h-8 w-auto"
                src={careConfig.mainLogo?.dark}
                alt="care logo"
              />
            </a>
          </div>
          <div
            className="max-w-8xl mx-auto mt-4 min-h-[96vh] rounded-lg border bg-gray-50 p-3 shadow"
            data-cui-page
          >
            <ErrorBoundary fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}>
              {pages}
            </ErrorBoundary>
          </div>
        </main>
      </PermissionProvider>
    </SidebarProvider>
  );
}
