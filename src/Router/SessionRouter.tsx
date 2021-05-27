import React from "react";
import loadable from "@loadable/component";
import {
  ForgotPassword,
  Login,
  Register,
  ResetPassword,
} from "../Components/Auth";
import { useRoutes } from "raviger";
import { PublicDashboard } from "../Components/Dashboard/PublicDashboard";
import msinsLogo from "../Common/mahakavach/msinsLogo.png";

const TopBar = loadable(() => import("../Components/Common/TopBar"));

const routes = {
  "/": () => <Login />,
  "/login": () => <Login />,
  "/dashboard": () => <PublicDashboard />,
  "/register": () => <Register />,
  "/forgot-password": () => <ForgotPassword />,
  "/password_reset/:token": ({ token }: any) => <ResetPassword token={token} />,
};

const SessionRouter = () => {
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
    <div className={!login ? "bg-green-100" : ""}>
      {!login && <TopBar />}
      <div className={!login ? "p-4 container max-w-5xl mx-auto" : ""}>
        {content}
      </div>
      <div className="bg-white flex items-center">
        <div className="max-w-5xl mx-auto flex md:flex-row flex-col p-4 f-full flex items-center">
          <div className="mx-auto p-2">
            <img className="h-20" src={msinsLogo} alt="Care Logo" />
          </div>
          <div className="max-w-xl text-sm">
            <a href="https://coronasafe.network/" className="text-gray-600">
              CoronaSafe Network is an open-source public utility designed by a
              multi-disciplinary team of innovators and volunteers who are
              working on a model to support Government efforts with full
              understanding and support of Government of Kerala.
            </a>
            <div className="mx-auto">
              <a
                href="https://github.com/coronasafe"
                className="care-secondary-color"
              >
                Contribute on Github
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRouter;
