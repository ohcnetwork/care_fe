import { useRoutes } from "raviger";
import { lazy } from "react";

import Login from "@/components/Auth/Login";
import ResetPassword from "@/components/Auth/ResetPassword";
import InvalidReset from "@/components/ErrorPages/InvalidReset";
import SessionExpired from "@/components/ErrorPages/SessionExpired";

import { AppointmentSuccess } from "@/pages/Appoinments/AppointmentSuccess";
import OTP from "@/pages/Appoinments/OTP";
import { AppointmentsPage } from "@/pages/Facility/AppointmentsPage";
import { FacilitiesPage } from "@/pages/Facility/FacilitiesPage";
import { FacilityDetailsPage } from "@/pages/Facility/FacilityDetailsPage";
import { LandingPage } from "@/pages/Landing/LandingPage";
import { PatientRegistration } from "@/pages/Patient/PatientRegistration";
import PatientSelect from "@/pages/Patient/PatientSelect";

const LicensesPage = lazy(() => import("@/components/Licenses/LicensesPage"));

const routes = {
  "/": () => <LandingPage />,
  "/facilities": () => <FacilitiesPage />,
  "/facility/:id": ({ id }: { id: string }) => <FacilityDetailsPage id={id} />,
  "/facility/:facilityId/appointments/:staffUsername/otp/:page": ({
    facilityId,
    staffUsername,
    page,
  }: {
    facilityId: string;
    staffUsername: string;
    page: string;
  }) => (
    <OTP facilityId={facilityId} staffUsername={staffUsername} page={page} />
  ),
  "/facility/:facilityId/appointments/:staffUsername/book-appointment": ({
    facilityId,
    staffUsername,
  }: {
    facilityId: string;
    staffUsername: string;
  }) => (
    <AppointmentsPage facilityId={facilityId} staffUsername={staffUsername} />
  ),
  "/facility/:facilityId/appointments/:staffUsername/patient-select": ({
    facilityId,
    staffUsername,
  }: {
    facilityId: string;
    staffUsername: string;
  }) => <PatientSelect facilityId={facilityId} staffUsername={staffUsername} />,
  "/facility/:facilityId/appointments/:staffUsername/patient-registration": ({
    facilityId,
    staffUsername,
  }: {
    facilityId: string;
    staffUsername: string;
  }) => (
    <PatientRegistration
      facilityId={facilityId}
      staffUsername={staffUsername}
    />
  ),
  "/facility/:facilityId/appointments/:appointmentId/success": ({
    facilityId,
    appointmentId,
  }: {
    facilityId: string;
    appointmentId: string;
  }) => (
    <AppointmentSuccess facilityId={facilityId} appointmentId={appointmentId} />
  ),
  "/login": () => <Login />,
  "/forgot-password": () => <Login forgot={true} />,
  "/password_reset/:token": ({ token }: { token: string }) => (
    <ResetPassword token={token} />
  ),
  "/session-expired": () => <SessionExpired />,
  "/licenses": () => <LicensesPage />,
  "/invalid-reset": () => <InvalidReset />,
};

export default function SessionRouter() {
  return useRoutes(routes) || <Login />;
}
