import { useRoutes } from "raviger";
import { Suspense } from "react";

import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, SidebarFor } from "@/components/ui/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/components/ui/sidebar/app-sidebar-provider";
import { WorkspaceHeader } from "@/components/ui/sidebar/workspace-header";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { useRefreshStickyAfterScrollLock } from "@/hooks/useRefreshStickyAfterScrollLock";
import useSidebarState from "@/hooks/useSidebarState";

import PatientUserProvider from "@/Providers/PatientUserProvider";

import PublicRouter from "./PublicRouter";
import { lazyPage } from "./lazyPage";
import ReferralRoutes from "./routes/ReferralRoutes";

const FacilitiesPage = lazyPage(
  () => import("@/pages/Facility/FacilitiesPage"),
  "FacilitiesPage",
);
const PatientIndex = lazyPage(() => import("@/pages/Patient/index"));
const PatientProfile = lazyPage(
  () => import("@/components/Patient/PatientProfile"),
  "PatientProfile",
);
const PublicPatientRegistration = lazyPage(
  () => import("@/pages/PublicAppointments/PatientRegistration"),
);
const PatientSelect = lazyPage(
  () => import("@/pages/PublicAppointments/PatientSelect"),
);
const ScheduleAppointment = lazyPage(
  () => import("@/pages/PublicAppointments/Schedule"),
  "ScheduleAppointment",
);
const AppointmentSuccess = lazyPage(
  () => import("@/pages/PublicAppointments/Success"),
  "AppointmentSuccess",
);

const DashboardRoutes = {
  ...ReferralRoutes,
  "/nearby_facilities": () => <FacilitiesPage />,
  "/facility/:facilityId/appointments/:appointmentId/success": ({
    appointmentId,
  }: {
    appointmentId: string;
  }) => <AppointmentSuccess appointmentId={appointmentId} />,
  "/patient/home": () => <PatientIndex />,
  "/patient/:id": ({ id }: { id: string }) => (
    <PatientProfile id={id} page="demography" />
  ),
  "/patient/:id/:tab": ({ id, tab }: { id: string; tab: string }) => (
    <PatientProfile id={id} page={tab} />
  ),
};

const AppointmentRoutes = {
  "/facility/:facilityId/appointments/:staffId/book-appointment": ({
    facilityId,
    staffId,
  }: {
    facilityId: string;
    staffId: string;
  }) => <ScheduleAppointment facilityId={facilityId} staffId={staffId} />,
  "/facility/:facilityId/appointments/:staffId/reschedule/:appointmentId": ({
    facilityId,
    staffId,
    appointmentId,
  }: {
    facilityId: string;
    staffId: string;
    appointmentId: string;
  }) => (
    <ScheduleAppointment
      facilityId={facilityId}
      staffId={staffId}
      appointmentId={appointmentId}
    />
  ),
  "/facility/:facilityId/appointments/:staffId/patient-select": ({
    facilityId,
    staffId,
  }: {
    facilityId: string;
    staffId: string;
  }) => <PatientSelect facilityId={facilityId} staffId={staffId} />,
  "/facility/:facilityId/appointments/:staffId/patient-registration": ({
    facilityId,
    staffId,
  }: {
    facilityId: string;
    staffId: string;
  }) => <PublicPatientRegistration facilityId={facilityId} staffId={staffId} />,
};

export default function PatientRouter() {
  useRefreshStickyAfterScrollLock();
  const pages = useRoutes(DashboardRoutes);

  const appointmentPages = useRoutes(AppointmentRoutes);

  const sidebarOpen = useSidebarState();

  if (!pages) {
    if (appointmentPages) {
      return (
        <PatientUserProvider>
          <Suspense fallback={<Loading />}>{appointmentPages}</Suspense>
        </PatientUserProvider>
      );
    }
    return <PublicRouter />;
  }

  return (
    <PatientUserProvider>
      <AppSidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar sidebarFor={SidebarFor.PATIENT} />
        <SidebarInset
          id="pages"
          className="min-h-svh min-w-0 focus:outline-hidden md:min-h-[calc(100svh-1rem)]"
        >
          <BrowserWarning />
          <WorkspaceHeader patient />
          <div className="min-w-0 p-4" data-cui-page>
            <ErrorBoundary fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}>
              <Suspense fallback={<Loading />}>{pages}</Suspense>
            </ErrorBoundary>
          </div>
        </SidebarInset>
      </AppSidebarProvider>
    </PatientUserProvider>
  );
}
