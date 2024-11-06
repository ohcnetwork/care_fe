import { useRoutes } from "raviger";
import { lazy } from "react";

import Login from "@/components/Auth/Login";
import ResetPassword from "@/components/Auth/ResetPassword";
import InvalidReset from "@/components/ErrorPages/InvalidReset";
import SessionExpired from "@/components/ErrorPages/SessionExpired";

const LicensesPage = lazy(() => import("@/components/Licenses/LicensesPage"));

const routes = {
  "/": () => <Login />,
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
