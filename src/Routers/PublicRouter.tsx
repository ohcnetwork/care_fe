import careConfig from "@careConfig";
import { Redirect, useRoutes } from "raviger";
import { lazy, Suspense } from "react";

import { withZod } from "@/lib/zodReady";

import Login from "@/components/Auth/Login";
import Loading from "@/components/Common/Loading";
import BrowserWarning from "@/components/ErrorPages/BrowserWarning";

import { LocalStorageKeys } from "@/common/constants";

// Only the login form ships with the entry; every other public page is split
// out so a cold load of /login stays small.
const loadLandingPage = () => import("@/pages/Landing/LandingPage");
// The 2FA and patient OTP pages build zod schemas, so they wait for zod.
const loadAuthenticate = withZod(
  () => import("@/components/Auth/Authenticate"),
);

const LandingPage = lazy(() =>
  loadLandingPage().then((m) => ({ default: m.LandingPage })),
);
const Authenticate = lazy(() =>
  loadAuthenticate().then((m) => ({ default: m.Authenticate })),
);
const FacilitiesPage = lazy(() =>
  import("@/pages/Facility/FacilitiesPage").then((m) => ({
    default: m.FacilitiesPage,
  })),
);
const FacilityDetailsPage = lazy(() =>
  import("@/pages/Facility/FacilityDetailsPage").then((m) => ({
    default: m.FacilityDetailsPage,
  })),
);
const LicensesPage = lazy(() =>
  import("@/pages/Licenses/Licenses").then((m) => ({
    default: m.LicensesPage,
  })),
);
const PatientLogin = lazy(
  withZod(() => import("@/pages/PublicAppointments/auth/PatientLogin")),
);
const ResetPassword = lazy(() => import("@/components/Auth/ResetPassword"));
const InvalidReset = lazy(() => import("@/components/ErrorPages/InvalidReset"));
const SessionExpired = lazy(
  () => import("@/components/ErrorPages/SessionExpired"),
);

// The landing page and 2FA are entry points too: for a signed-out visitor,
// start fetching their chunk while the app is still booting (i18n, plugin
// config) instead of after the first render.
const isSignedOut =
  !localStorage.getItem(LocalStorageKeys.accessToken) &&
  !localStorage.getItem(LocalStorageKeys.patientTokenKey);
if (isSignedOut) {
  if (window.location.pathname === "/" && !careConfig.disablePatientLogin) {
    loadLandingPage();
  } else if (window.location.pathname === "/2fa") {
    loadAuthenticate();
  }
}

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
