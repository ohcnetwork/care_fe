import careConfig from "@careConfig";
import { Redirect, usePath, useRedirect, useRoutes } from "raviger";

import IconIndex from "@/CAREUI/icons/Index";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, SidebarFor } from "@/components/ui/sidebar/app-sidebar";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import SessionExpired from "@/components/ErrorPages/SessionExpired";

import useAuthUser from "@/hooks/useAuthUser";
import { usePluginRoutes } from "@/hooks/useCareApps";
import useSidebarState from "@/hooks/useSidebarState";

import ConsultationRoutes from "@/Routers/routes/ConsultationRoutes";
import FacilityRoutes from "@/Routers/routes/FacilityRoutes";
import OrganizationRoutes from "@/Routers/routes/OrganizationRoutes";
import PatientRoutes from "@/Routers/routes/PatientRoutes";
import ResourceRoutes from "@/Routers/routes/ResourceRoutes";
import ScheduleRoutes from "@/Routers/routes/ScheduleRoutes";
import UserRoutes from "@/Routers/routes/UserRoutes";
import AdminRoutes from "@/Routers/routes/adminRoutes";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { ShortcutCommandDialog } from "@/components/Facility/ShortcutCommandDialog";
import { Button } from "@/components/ui/button";
import { PermissionProvider } from "@/context/PermissionContext";
import { useShortcuts } from "@/context/ShortcutContext";
import { PlugConfigEdit } from "@/pages/Apps/PlugConfigEdit";
import { PlugConfigList } from "@/pages/Apps/PlugConfigList";
import UserDashboard from "@/pages/UserDashboard";

// List of paths and patterns where the sidebar should be hidden
const PATHS_WITHOUT_SIDEBAR = [
  // Exact matches
  "/",
  "/session-expired",
  // Pattern matches (using regex)
  /^\/facility\/[^/]+\/services_requests\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/to_receive\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/to_dispatch\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/create_delivery$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/requests\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/requests\/[^/]+\/edit$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/external_supply\/purchase_orders\/new$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/external_supply\/purchase_orders\/[^/]+\/edit$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/external_supply\/deliveries\/[^/]+$/,
  /^\/facility\/[^/]+\/queues\/[^/]+\/tokens\/[^/]+$/,
];

export type RouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [_ in Param | keyof RouteParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [_ in Param]: string }
      : Record<string, never>;

export type RouteFunction<T extends string> = (
  params: RouteParams<T>,
) => React.ReactNode;

export type AppRoutes = {
  [K in string]: RouteFunction<K>;
};

const Routes: AppRoutes = {
  "/": () => <UserDashboard />,
  ...ConsultationRoutes,
  ...FacilityRoutes,
  ...PatientRoutes,
  ...ResourceRoutes,
  ...ScheduleRoutes,
  ...UserRoutes,
  ...OrganizationRoutes,

  "/session-expired": () => <SessionExpired />,
  "/not-found": () => <ErrorPage />,
  "/icons": () => <IconIndex />,

  // Only include the icon route in development environment
  ...(import.meta.env.PROD ? { "/icons": () => <IconIndex /> } : {}),

  "/apps": () => <PlugConfigList />,
  "/apps/plug-configs/:slug": ({ slug }) => <PlugConfigEdit slug={slug} />,
  "/login": () => <Redirect to="/" />,
};

const AdminRouter: AppRoutes = {
  ...AdminRoutes,
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

  const appPages = useRoutes(routes);
  const adminPages = useRoutes(AdminRouter);

  const currentPath = usePath();
  const isAdminPage = currentPath?.startsWith("/admin");

  const sidebarFor = isAdminPage ? SidebarFor.ADMIN : SidebarFor.FACILITY;

  const pages = appPages || adminPages || <ErrorPage />;

  const user = useAuthUser();

  // Check if the current path matches any of the paths without sidebar
  const shouldShowSidebar =
    currentPath &&
    !PATHS_WITHOUT_SIDEBAR.some((path) =>
      typeof path === "string" ? path === currentPath : path.test(currentPath),
    );
  const { commandDialogOpen, setCommandDialogOpen } = useShortcuts();
  const sidebarOpen = useSidebarState();

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <PermissionProvider
        userPermissions={user?.permissions || []}
        isSuperAdmin={user?.is_superuser || false}
      >
        {shouldShowSidebar && (
          <AppSidebar user={user} sidebarFor={sidebarFor} />
        )}
        <main
          id="pages"
          className="flex flex-col flex-1 max-w-full min-h-[calc(100svh-(--spacing(4)))] md:m-2 md:peer-data-[state=collapsed]:ml-0 border border-gray-200 rounded-lg shadow-sm bg-gray-50 focus:outline-hidden"
        >
          <Button onClick={() => setCommandDialogOpen(true)} className="hidden">
            <ShortcutBadge actionId="show-shortcuts" />
          </Button>

          <ShortcutCommandDialog
            open={commandDialogOpen}
            onOpenChange={setCommandDialogOpen}
          />
          <BrowserWarning />
          <div className="relative z-10 flex h-16 bg-white shadow-sm shrink-0 md:hidden">
            <div className="flex items-center">
              {shouldShowSidebar && <SidebarTrigger />}
            </div>
            <a className="flex items-center w-full h-full px-4 md:hidden">
              <img
                className="w-auto h-8"
                src={careConfig.mainLogo?.dark}
                alt="care logo"
              />
            </a>
          </div>
          <div className="p-3 mt-4" data-cui-page>
            <ErrorBoundary fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}>
              {pages}
            </ErrorBoundary>
          </div>
        </main>
      </PermissionProvider>
    </SidebarProvider>
  );
}
