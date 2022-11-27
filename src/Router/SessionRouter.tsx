import loadable from "@loadable/component";
import { Login, ResetPassword } from "../Components/Auth";
import { useRoutes } from "raviger";
import SessionExpired from "../Components/ErrorPages/SessionExpired";
import InvalidReset from "../Components/ErrorPages/InvalidReset";
const TopBar = loadable(() => import("../Components/Common/TopBar"));

const routes = {
  "/": () => <Login />,
  "/login": () => <Login />,
  "/forgot-password": () => <Login forgot={true} />,
  "/password_reset/:token": ({ token }: any) => <ResetPassword token={token} />,
  "/session-expired": () => <SessionExpired />,
  "/invalid-reset": () => <InvalidReset />,
};

export default function SessionRouter() {
  const content = useRoutes(routes) || <Login />;
  const path =
    content &&
    content.props &&
    content.props.children &&
    content.props.children.props &&
    content.props.children.props.value;
  const login =
    !path || path === "/" || path === "/login" || path === "/login/";
  return (
    <div className={!login ? "bg-primary-100" : ""}>
      {!login && <TopBar />}
      <div className={!login ? "p-4 container max-w-5xl mx-auto" : ""}>
        {content}
      </div>
    </div>
  );
}
