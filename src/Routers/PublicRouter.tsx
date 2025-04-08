import { useRoutes } from "raviger";

import { Authenticate } from "@/components/Auth/Authenticate";
import Login from "@/components/Auth/Login";
import ResetPassword from "@/components/Auth/ResetPassword";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";
import InvalidReset from "@/components/ErrorPages/InvalidReset";
import SessionExpired from "@/components/ErrorPages/SessionExpired";

import { FacilitiesPage } from "@/pages/Facility/FacilitiesPage";
import { FacilityDetailsPage } from "@/pages/Facility/FacilityDetailsPage";
import { LandingPage } from "@/pages/Landing/LandingPage";
import { LicensesPage } from "@/pages/Licenses/Licenses";
import PatientLogin from "@/pages/PublicAppointments/auth/PatientLogin";

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
  "/login": () => <Login />,
  "/2fa": () => <Authenticate />,
  "/forgot-password": () => <Login forgot={true} />,
  "/password_reset/:token": ({ token }: { token: string }) => (
    <ResetPassword token={token} />
  ),
  "/session-expired": () => <SessionExpired />,
  "/licenses": () => <LicensesPage />,
  "/invalid-reset": () => <InvalidReset />,
};

export default function PublicRouter() {
  return (
    <>
      <BrowserWarning />
      {useRoutes(routes) || <Login />}
    </>
  );
}
