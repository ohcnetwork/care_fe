import careConfig from "@careConfig";
import { Redirect, useRoutes } from "raviger";
import { lazy, Suspense } from "react";

import Loading from "@/components/Common/Loading";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";

const Authenticate = lazy(() =>
  import("@/components/Auth/Authenticate").then((module) => ({
    default: module.Authenticate,
  })),
);
const Login = lazy(() => import("@/components/Auth/Login"));
const ResetPassword = lazy(() => import("@/components/Auth/ResetPassword"));
const InvalidReset = lazy(() => import("@/components/ErrorPages/InvalidReset"));
const SessionExpired = lazy(
  () => import("@/components/ErrorPages/SessionExpired"),
);
const FacilitiesPage = lazy(() =>
  import("@/pages/Facility/FacilitiesPage").then((module) => ({
    default: module.FacilitiesPage,
  })),
);
const FacilityDetailsPage = lazy(() =>
  import("@/pages/Facility/FacilityDetailsPage").then((module) => ({
    default: module.FacilityDetailsPage,
  })),
);
const LandingPage = lazy(() =>
  import("@/pages/Landing/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
const LicensesPage = lazy(() =>
  import("@/pages/Licenses/Licenses").then((module) => ({
    default: module.LicensesPage,
  })),
);
const PatientLogin = lazy(
  () => import("@/pages/PublicAppointments/auth/PatientLogin"),
);

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
  "/facility/:facilityId/appointments/:staffId/otp/:page": ({
    facilityId,
    staffId,
    page,
  }: {
    facilityId: string;
    staffId: string;
    page: string;
  }) =>
    careConfig.disablePatientLogin ? (
      <Redirect to="/login" />
    ) : (
      <PatientLogin facilityId={facilityId} staffId={staffId} page={page} />
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

  return (
    <>
      <BrowserWarning />
      <Suspense fallback={<Loading />}>{routeResult || <Login />}</Suspense>
    </>
  );
}
