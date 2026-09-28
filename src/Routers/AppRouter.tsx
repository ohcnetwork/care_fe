import { Redirect, usePath, useRedirect, useRoutes } from "raviger";

import { cn } from "@/lib/utils";

import IconIndex from "@/CAREUI/icons/Index";

import { AppSidebar, SidebarFor } from "@/components/ui/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/components/ui/sidebar/app-sidebar-provider";
import { WorkspaceHeader } from "@/components/ui/sidebar/workspace-header";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import SessionExpired from "@/components/ErrorPages/SessionExpired";

import useAuthUser from "@/hooks/useAuthUser";
import { useOrganizationRoutes, usePluginRoutes } from "@/hooks/useCareApps";
import useSidebarState from "@/hooks/useSidebarState";

import { routes as publicRoutes } from "@/Routers/PublicRouter";
import ConsultationRoutes from "@/Routers/routes/ConsultationRoutes";
import FacilityRoutes from "@/Routers/routes/FacilityRoutes";
import OrganizationRoutes from "@/Routers/routes/OrganizationRoutes";
import PatientRoutes from "@/Routers/routes/PatientRoutes";
import ResourceRoutes from "@/Routers/routes/ResourceRoutes";
import ScheduleRoutes from "@/Routers/routes/ScheduleRoutes";
import UserRoutes from "@/Routers/routes/UserRoutes";
import AdminRoutes from "@/Routers/routes/adminRoutes";
import { ShortcutCommandDialog } from "@/components/Facility/ShortcutCommandDialog";
import { PermissionProvider } from "@/context/PermissionContext";
import { useShortcuts } from "@/context/ShortcutContext";
import { isFacilitySettingsPath } from "@/pages/Facility/settings/utils";
import { LicensesPage } from "@/pages/Licenses/Licenses";
import UserDashboard from "@/pages/UserDashboard";

// List of paths and patterns where the sidebar should be hidden
const PATHS_WITHOUT_SIDEBAR = [
  // Exact matches
  "/",
  "/login",
  "/session-expired",
  // Pattern matches (using regex)
  /^\/facility\/[^/]+\/service_requests\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/service_requests\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/to_receive\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/to_dispatch\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/create_delivery$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/requests\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/internal_transfers\/requests\/[^/]+\/edit$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/external_supply\/purchase_orders\/new$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/external_supply\/purchase_orders\/[^/]+\/edit$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/external_supply\/deliveries\/[^/]+$/,
  /^\/facility\/[^/]+\/queues\/[^/]+\/tokens\/[^/]+$/,
  // Questionnaire form routes
  /^\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+\/questionnaire(\/[^/]+)?$/,
  // Pharmacy related routes
  /^\/facility\/[^/]+\/locations\/[^/]+\/medication_requests\/patient\/[^/]+\/bill\/prescriptions\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/medication_requests\/patient\/[^/]+\/bill\/dispense\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/medication_dispense\/order\/[^/]+$/,
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
  "/licenses": () => <LicensesPage />,

  // Only include the icon route in development environment
  ...(import.meta.env.PROD ? { "/icons": () => <IconIndex /> } : {}),
};

const AdminRouter: AppRoutes = {
  ...AdminRoutes,
};

const publicRedirects = Object.fromEntries(
  Object.keys(publicRoutes).map((path) => [path, () => <Redirect to="/" />]),
);

export default function AppRouter() {
  const pluginRoutes = usePluginRoutes();
  const organizationRoutes = useOrganizationRoutes();
  let routes = Routes;

  useRedirect("/user", "/users");

  // Merge in Plugin Routes
  routes = {
    ...pluginRoutes,
    ...organizationRoutes,
    ...routes,
  };

  const appPages = useRoutes(routes);
  const adminPages = useRoutes(AdminRouter);
  const publicRedirectsPages = useRoutes(publicRedirects);

  const currentPath = usePath();
  const isAdminPage = currentPath?.startsWith("/admin");

  const sidebarFor = isAdminPage ? SidebarFor.ADMIN : SidebarFor.FACILITY;

  const pages = appPages || adminPages || publicRedirectsPages || <ErrorPage />;

  const user = useAuthUser();

  // Check if the current path matches any of the paths without sidebar
  const shouldShowSidebar =
    currentPath &&
    !PATHS_WITHOUT_SIDEBAR.some((path) =>
      typeof path === "string" ? path === currentPath : path.test(currentPath),
    );
  const { commandDialogOpen, setCommandDialogOpen } = useShortcuts();
  const sidebarOpen = useSidebarState();
  const isLocationWorkspace =
    shouldShowSidebar &&
    /^\/facility\/[^/]+\/locations\/[^/]+/.test(currentPath);
  const isSettingsWorkspace =
    shouldShowSidebar && isFacilitySettingsPath(currentPath);
  const isServiceWorkspace =
    !!shouldShowSidebar &&
    /^\/facility\/[^/]+\/services\/[^/]+/.test(currentPath);
  const isInnerWorkspace = !!(
    isLocationWorkspace ||
    isSettingsWorkspace ||
    isServiceWorkspace
  );

  return (
    <AppSidebarProvider
      defaultOpen={sidebarOpen}
      innerWorkspace={isInnerWorkspace}
    >
      <PermissionProvider
        userPermissions={user?.permissions || []}
        isSuperAdmin={user?.is_superuser || false}
      >
        {shouldShowSidebar && (
          <AppSidebar user={user} sidebarFor={sidebarFor} />
        )}
        <main
          id="pages"
          data-slot="sidebar-inset"
          className={cn(
            "flex min-w-0 max-w-full flex-1 flex-col bg-gray-50 focus:outline-hidden",
            isInnerWorkspace
              ? "min-h-svh"
              : "min-h-svh md:m-2 md:ml-0 md:min-h-[calc(100svh-1rem)] md:rounded-[14px] md:shadow-sm md:peer-data-[state=collapsed]:ml-2",
          )}
        >
          <ShortcutCommandDialog
            open={commandDialogOpen}
            onOpenChange={setCommandDialogOpen}
          />
          <BrowserWarning />
          {shouldShowSidebar ? (
            <WorkspaceHeader
              user={user}
              onSearch={() => setCommandDialogOpen(true)}
            />
          ) : null}
          <div className={"min-w-0 py-2 px-2"} data-cui-page>
            <ErrorBoundary fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}>
              {pages}
            </ErrorBoundary>
          </div>
        </main>
      </PermissionProvider>
    </AppSidebarProvider>
  );
}
