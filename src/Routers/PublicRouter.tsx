import careConfig from "@careConfig";
import { Redirect, usePath, useRoutes } from "raviger";

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
  "/": () =>
    careConfig.disablePatientLogin ? <Redirect to="/login" /> : <LandingPage />,
  "/facilities": () =>
    careConfig.disablePatientLogin ? (
      <Redirect to="/login" />
    ) : (
      <FacilitiesPage />
    ),
  "/facility/:id": ({ id }: { id: string }) =>
    careConfig.disablePatientLogin ? (
      <Redirect to="/login" />
    ) : (
      <FacilityDetailsPage id={id} />
    ),
  "/patient/login": () =>
    careConfig.disablePatientLogin ? (
      <Redirect to="/login" />
    ) : (
      <PatientLogin />
    ),
  "/facility/:facilityId/appointments/:staffId/otp/:page": ({
    facilityId,
    staffId,
  }: {
    facilityId: string;
    staffId: string;
  }) =>
    careConfig.disablePatientLogin ? (
      <Redirect to="/login" />
    ) : (
      <PatientLogin
        redirectTo={`/facility/${facilityId}/appointments/${staffId}/book-appointment`}
      />
    ),
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
  const routeResult = useRoutes(routes);
  const path = usePath();

  const isPatientPath =
    !!path && path.startsWith("/patient") && path !== "/patient/login";

  return (
    <>
      <BrowserWarning />
      {routeResult ||
        (isPatientPath ? <Redirect to="/patient/login" /> : <Login />)}
    </>
  );
}
