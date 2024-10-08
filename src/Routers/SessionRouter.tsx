import { Login, ResetPassword } from "../Components/Auth";
import { useRoutes } from "raviger";
import SessionExpired from "../Components/ErrorPages/SessionExpired";
import InvalidReset from "../Components/ErrorPages/InvalidReset";
import LicensesPage from "../Components/LicensesPage";

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
