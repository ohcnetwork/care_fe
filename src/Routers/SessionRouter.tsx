import { useRoutes } from "raviger";
import { lazy } from "react";

import Login from "@/components/Auth/Login";
import ResetPassword from "@/components/Auth/ResetPassword";
import InvalidReset from "@/components/ErrorPages/InvalidReset";
import SessionExpired from "@/components/ErrorPages/SessionExpired";

import { PatientRegistration } from "@/pages/Appoinments/PatientRegistration";
import PatientSelect from "@/pages/Appoinments/PatientSelect";
import { ScheduleAppointment } from "@/pages/Appoinments/Schedule";
import PatientLogin from "@/pages/Appoinments/auth/PatientLogin";
import { FacilitiesPage } from "@/pages/Facility/FacilitiesPage";
import { FacilityDetailsPage } from "@/pages/Facility/FacilityDetailsPage";
import { LandingPage } from "@/pages/Landing/LandingPage";

const LicensesPage = lazy(() => import("@/components/Licenses/LicensesPage"));

export const routes = {
  "/": () => <LandingPage />,
  "/facilities": () => <FacilitiesPage />,
  "/facility/:id": ({ id }: { id: string }) => <FacilityDetailsPage id={id} />,
  "/facility/:facilityId/appointments/:staffId/otp/:page": ({
    facilityId,
    staffId,
    page,
  }: {
    facilityId: string;
    staffId: string;
    page: string;
  }) => <PatientLogin facilityId={facilityId} staffId={staffId} page={page} />,
  "/facility/:facilityId/appointments/:staffId/book-appointment": ({
    facilityId,
    staffId,
  }: {
    facilityId: string;
    staffId: string;
  }) => <ScheduleAppointment facilityId={facilityId} staffId={staffId} />,
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
  }) => <PatientRegistration facilityId={facilityId} staffId={staffId} />,
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
