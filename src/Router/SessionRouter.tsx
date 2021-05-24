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
import { withTranslation } from "react-i18next";
const TopBar = loadable(() => import("../Components/Common/TopBar"));

const routes = {
  "/": () => <Login />,
  "/login": () => <Login />,
  "/dashboard": () => <PublicDashboard />,
  "/register": () => <Register />,
  "/forgot-password": () => <ForgotPassword />,
  "/password_reset/:token": ({ token }: any) => <ResetPassword token={token} />,
};

const SessionRouter = (props: any) => {
  const content = useRoutes(routes) || <Login />;
  const { t } = props;
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
            <img
              className="h-20"
              src="https://cdn.coronasafe.network/ksdma_logo.webp"
              alt="Care Logo"
            />
          </div>
          <div className="max-w-xl text-sm">
            <a href="https://coronasafe.network/" className="text-gray-600">
              {t("footer_body")}
            </a>
            <div className="mx-auto">
              <a
                href="https://github.com/coronasafe"
                className="care-secondary-color"
              >
                {t("contribute_github")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withTranslation()(SessionRouter);
