import { useRoutes } from "raviger";

import { AppSidebar, SidebarFor } from "@/components/ui/sidebar/app-sidebar";
import { AppSidebarProvider } from "@/components/ui/sidebar/app-sidebar-provider";
import { WorkspaceHeader } from "@/components/ui/sidebar/workspace-header";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { patientTabs } from "@/components/Patient/PatientDetailsTab";
import { PatientProfile } from "@/components/Patient/PatientProfile";

import useSidebarState from "@/hooks/useSidebarState";

import PatientUserProvider from "@/Providers/PatientUserProvider";
import { FacilitiesPage } from "@/pages/Facility/FacilitiesPage";
import PatientIndex from "@/pages/Patient/index";
import PublicPatientRegistration from "@/pages/PublicAppointments/PatientRegistration";
import PatientSelect from "@/pages/PublicAppointments/PatientSelect";
import { ScheduleAppointment } from "@/pages/PublicAppointments/Schedule";
import { AppointmentSuccess } from "@/pages/PublicAppointments/Success";

import PublicRouter from "./PublicRouter";

const DashboardRoutes = {
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
  "/patient/:id/:tab": ({
    id,
    tab,
  }: {
    id: string;
    tab: (typeof patientTabs)[number]["route"];
  }) => <PatientProfile id={id} page={tab} />,
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
  const pages = useRoutes(DashboardRoutes);

  const appointmentPages = useRoutes(AppointmentRoutes);

  const sidebarOpen = useSidebarState();

  if (!pages) {
    if (appointmentPages) {
      return <PatientUserProvider>{appointmentPages}</PatientUserProvider>;
    }
    return <PublicRouter />;
  }

  return (
    <PatientUserProvider>
      <AppSidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar sidebarFor={SidebarFor.PATIENT} />
        <main
          id="pages"
          data-slot="sidebar-inset"
          className="flex min-w-0 flex-1 flex-col bg-white text-neutral-950 focus:outline-hidden md:m-2 md:ml-0 md:min-h-[calc(100svh-1rem)] md:rounded-[14px] md:shadow-sm md:peer-data-[state=collapsed]:ml-2"
        >
          <BrowserWarning />
          <WorkspaceHeader patient />
          <div className="min-w-0 p-4" data-cui-page>
            <ErrorBoundary fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}>
              {pages}
            </ErrorBoundary>
          </div>
        </main>
      </AppSidebarProvider>
    </PatientUserProvider>
  );
}
