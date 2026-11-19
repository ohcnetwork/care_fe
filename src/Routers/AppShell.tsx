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
import { useLayoutFlags } from "@/lib/router/layoutFlags";
import { LocationPageHeader } from "@/pages/Facility/locations/components/LocationPageHeader";
import { FacilitySettingsPageHeader } from "@/pages/Facility/settings/FacilitySettingsPageHeader";
import { useNavigationTrail } from "@/Utils/navigationTrail";

export function AppShell({ children }: { children: React.ReactNode }) {
  useRefreshStickyAfterScrollLock();
  useNavigationTrail();

  const {
    sidebar: shouldShowSidebar,
    workspace,
    navigation,
  } = useLayoutFlags();
  const sidebarFor =
    navigation === "admin" ? SidebarFor.ADMIN : SidebarFor.FACILITY;

  const user = useAuthUser();
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
