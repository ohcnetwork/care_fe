import { useMatches } from "@tanstack/react-router";
import { usePath } from "raviger";

import { cn } from "@/lib/utils";

import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, SidebarFor } from "@/components/ui/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/components/ui/sidebar/app-sidebar-provider";
import { WorkspaceHeader } from "@/components/ui/sidebar/workspace-header";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import useAuthUser from "@/hooks/useAuthUser";
import { useRefreshStickyAfterScrollLock } from "@/hooks/useRefreshStickyAfterScrollLock";
import useSidebarState from "@/hooks/useSidebarState";

import { ShortcutCommandDialog } from "@/components/Facility/ShortcutCommandDialog";
import { PermissionProvider } from "@/context/PermissionContext";
import { useShortcuts } from "@/context/ShortcutContext";
import type { Workspace } from "@/lib/router/staticData";
import { LocationPageHeader } from "@/pages/Facility/locations/components/LocationPageHeader";
import { FacilitySettingsPageHeader } from "@/pages/Facility/settings/FacilitySettingsPageHeader";
import { isFacilitySettingsPath } from "@/pages/Facility/settings/utils";
import { useNavigationTrail } from "@/Utils/navigationTrail";

/**
 * Paths of the legacy (raviger) route tables where the sidebar is hidden.
 * Routes in the TanStack tree set `staticData.sidebar` instead. An entry
 * leaves this list when its area moves to `src/routes/`.
 */
const LEGACY_PATHS_WITHOUT_SIDEBAR = [
  /^\/referrals\/[^/]+(?:\/respond)?$/,
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
  // Encounter pages give the full width to the chart and carry their own back button
  /^\/(?:facility|organization)\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+\/[^/]+$/,
  // Questionnaire fill routes (fullscreen v2 fill experience)
  /^\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+\/questionnaire(\/[^/]+)?$/,
  /^\/facility\/[^/]+\/patient\/[^/]+\/questionnaire(\/[^/]+)?$/,
  /^\/facility\/[^/]+\/patient\/[^/]+\/consultation$/,
  /^\/patient\/[^/]+\/questionnaire(\/[^/]+)?$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/questionnaire(\/[^/]+)?$/,
  // Questionnaire studio (fullscreen builder) routes
  /^\/admin\/questionnaires\/[^/]+\/edit$/,
  // Pharmacy related routes
  /^\/facility\/[^/]+\/locations\/[^/]+\/medication_requests\/patient\/[^/]+\/bill\/prescriptions\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/medication_requests\/patient\/[^/]+\/bill\/dispense\/[^/]+$/,
  /^\/facility\/[^/]+\/locations\/[^/]+\/medication_dispense\/order\/[^/]+$/,
];

const LEGACY_SPLAT_ROUTE_ID = "/_app/$";

interface LayoutFlags {
  sidebar: boolean;
  workspace?: Workspace;
}

/**
 * Reads layout flags from the matched routes. The deepest route that sets a
 * flag wins. Legacy paths (rendered by the `$` splat) fall back to the URL
 * regexes until their area is migrated.
 */
function useLayoutFlags(currentPath: string): LayoutFlags {
  const matches = useMatches();
  const isLegacy = matches.some((m) => m.routeId === LEGACY_SPLAT_ROUTE_ID);

  if (isLegacy) {
    const sidebar = !LEGACY_PATHS_WITHOUT_SIDEBAR.some((path) =>
      typeof path === "string" ? path === currentPath : path.test(currentPath),
    );
    let workspace: Workspace | undefined;
    if (/^\/facility\/[^/]+\/locations\/[^/]+/.test(currentPath)) {
      workspace = "location";
    } else if (isFacilitySettingsPath(currentPath)) {
      workspace = "settings";
    } else if (/^\/facility\/[^/]+\/services\/[^/]+/.test(currentPath)) {
      workspace = "service";
    }
    return { sidebar, workspace: sidebar ? workspace : undefined };
  }

  const flags = matches.reduce<LayoutFlags>(
    (acc, m) => ({
      sidebar: m.staticData.sidebar ?? acc.sidebar,
      workspace: m.staticData.workspace ?? acc.workspace,
    }),
    { sidebar: true },
  );
  return { ...flags, workspace: flags.sidebar ? flags.workspace : undefined };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useRefreshStickyAfterScrollLock();
  useNavigationTrail();

  const currentPath = usePath() ?? "/";
  const isAdminPage = currentPath.startsWith("/admin");
  const sidebarFor = isAdminPage ? SidebarFor.ADMIN : SidebarFor.FACILITY;

  const user = useAuthUser();
  const { sidebar: shouldShowSidebar, workspace } = useLayoutFlags(currentPath);
  const { commandDialogOpen, setCommandDialogOpen } = useShortcuts();
  const sidebarOpen = useSidebarState();
  const isInnerWorkspace = !!workspace;

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
        <SidebarInset
          id="pages"
          className={cn(
            "h-svh min-w-0 max-w-full focus:outline-hidden",
            !isInnerWorkspace && "md:h-[calc(100svh-1rem)]",
          )}
        >
          <ShortcutCommandDialog
            open={commandDialogOpen}
            onOpenChange={setCommandDialogOpen}
          />
          <BrowserWarning />
          {workspace === "location" ? (
            <LocationPageHeader />
          ) : workspace === "settings" ? (
            <FacilitySettingsPageHeader />
          ) : shouldShowSidebar ? (
            <WorkspaceHeader
              user={user}
              onSearch={() => setCommandDialogOpen(true)}
            />
          ) : null}
          <div
            className={
              "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 md:px-6 pb-4"
            }
            data-cui-page
          >
            <ErrorBoundary fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}>
              {children}
            </ErrorBoundary>
          </div>
        </SidebarInset>
      </PermissionProvider>
    </AppSidebarProvider>
  );
}
