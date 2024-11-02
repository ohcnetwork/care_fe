import { Login, ResetPassword } from "@/components/Auth";
import { useRoutes } from "raviger";
import SessionExpired from "@/components/ErrorPages/SessionExpired";
import InvalidReset from "@/components/ErrorPages/InvalidReset";
import LicensesPage from "@/components/Licenses/LicensesPage";

const routes = {
  "/": () => <Login />,
  "/login": () => <Login />,
  "/forgot-password": () => <Login forgot={true} />,
  "/password_reset/:token": ({ token }: any) => <ResetPassword token={token} />,
  "/session-expired": () => <SessionExpired />,
  "/licenses": () => <LicensesPage />,
  "/invalid-reset": () => <InvalidReset />,
};

export default function SessionRouter() {
  return useRoutes(routes) || <Login />;
}
