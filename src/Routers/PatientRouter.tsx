import { Redirect, useRoutes } from "raviger";

import ErrorBoundary from "@/components/Common/ErrorBoundary";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import PatientUserProvider from "@/Providers/PatientUserProvider";
import DiagnosticReportDetail from "@/pages/Patient/DiagnosticReportDetail";
import PatientProfileSettings from "@/pages/Patient/PatientProfileSettings";
import PatientRecords from "@/pages/Patient/PatientRecords";
import PatientVisits from "@/pages/Patient/PatientVisits";
import PrescriptionDetail from "@/pages/Patient/PrescriptionDetail";
import SelectProfile from "@/pages/Patient/SelectProfile";
import VisitSummary from "@/pages/Patient/VisitSummary";
import PatientIndex from "@/pages/Patient/index";
import BookFacility from "@/pages/PublicAppointments/BookFacility";
import BookPractitioner from "@/pages/PublicAppointments/BookPractitioner";
import PublicPatientRegistration from "@/pages/PublicAppointments/PatientRegistration";
import { ScheduleAppointment } from "@/pages/PublicAppointments/Schedule";
import { AppointmentSuccess } from "@/pages/PublicAppointments/Success";

import PublicRouter from "./PublicRouter";

/** Routes available to a patient signed in with an OTP session. */
const DashboardRoutes = {
  // Step 1 of the booking wizard for a signed-in patient. The logged-out
  // public facility browser stays on FacilitiesPage via PublicRouter.
  "/nearby_facilities": () => <BookFacility />,
  "/facility/:facilityId/appointments/:appointmentId/success": ({
    appointmentId,
  }: {
    appointmentId: string;
  }) => <AppointmentSuccess appointmentId={appointmentId} />,

  "/patient/select-profile": () => <SelectProfile />,
  "/patient/add-profile": () => <PublicPatientRegistration />,
  "/patient/home": () => <PatientIndex />,

  "/patient/visits": () => <PatientVisits />,
  "/patient/visits/:appointmentId": ({
    appointmentId,
  }: {
    appointmentId: string;
  }) => <VisitSummary appointmentId={appointmentId} />,

  "/patient/profile": () => <PatientProfileSettings />,

  // Step 2 of booking, so the flow never leaves the wizard for the public
  // facility page.
  "/patient/book/:facilityId": ({ facilityId }: { facilityId: string }) => (
    <BookPractitioner facilityId={facilityId} />
  ),

  "/patient/records": () => <PatientRecords />,
  "/patient/records/prescriptions/:id": ({ id }: { id: string }) => (
    <PrescriptionDetail id={id} />
  ),
  "/patient/records/reports/:id": ({ id }: { id: string }) => (
    <DiagnosticReportDetail id={id} />
  ),

  // Superseded by the records hub; kept so existing links keep working.
  "/patient/medications": () => (
    <Redirect to="/patient/records" query={{ tab: "prescriptions" }} />
  ),
  "/patient/diagnostic_reports": () => (
    <Redirect to="/patient/records" query={{ tab: "reports" }} />
  ),

  // `/patient/:id` is deliberately NOT routed here. PatientProfile is a
  // staff-facing component backed by authenticated facility APIs, so under an
  // OTP session it only ever rendered an error page — and its wildcard swallowed
  // unmatched paths like `/patient/profile`. The staff app serves those routes
  // through AppRouter (src/Routers/routes/PatientRoutes.tsx) instead.
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

  if (!pages) {
    if (appointmentPages) {
      return <PatientUserProvider>{appointmentPages}</PatientUserProvider>;
    }
    return <PublicRouter />;
  }

  // Each patient page owns its own chrome via PatientAppShell.
  return (
    <PatientUserProvider>
      <BrowserWarning />
      <ErrorBoundary fallback={<ErrorPage forError="PAGE_LOAD_ERROR" />}>
        {pages}
      </ErrorBoundary>
    </PatientUserProvider>
  );
}
