import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, SidebarFor } from "@/components/ui/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/components/ui/sidebar/app-sidebar-provider";
import { WorkspaceHeader } from "@/components/ui/sidebar/workspace-header";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { useRefreshStickyAfterScrollLock } from "@/hooks/useRefreshStickyAfterScrollLock";
import useSidebarState from "@/hooks/useSidebarState";

import { useLayoutFlags } from "@/lib/router/layoutFlags";
import PatientUserProvider from "@/Providers/PatientUserProvider";

/**
 * Chrome for the patient portal (OTP sign-in). Routes that set
 * `staticData.patientChrome: false` (the appointment booking flow) render
 * without chrome. All patient pages get the patient user context.
 */
export function PatientShell({ children }: { children: React.ReactNode }) {
  useRefreshStickyAfterScrollLock();
  const sidebarOpen = useSidebarState();
  const { patientChrome: showChrome } = useLayoutFlags();

  return (
    <PatientUserProvider>
      {showChrome ? (
        <AppSidebarProvider defaultOpen={sidebarOpen}>
          <AppSidebar sidebarFor={SidebarFor.PATIENT} />
          <SidebarInset
            id="pages"
            className="min-h-svh min-w-0 focus:outline-hidden md:min-h-[calc(100svh-1rem)]"
          >
            <BrowserWarning />
            <WorkspaceHeader patient />
            <div className="min-w-0 px-4 pb-4" data-cui-page>
              <ErrorBoundary
                fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}
              >
                {children}
              </ErrorBoundary>
            </div>
          </SidebarInset>
        </AppSidebarProvider>
      ) : (
        children
      )}
    </PatientUserProvider>
  );
}
