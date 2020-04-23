import React from "react";
import { Login, Register } from "../Components/Auth";
import { useRoutes } from "hookrouter";
import TopBar from "../Components/Common/TopBar";
import { PublicDashboard } from "../Components/Dashboard/PublicDashboard";

import AmbulanceOnboarding from "../Components/Ambulance/AmbulanceOnboarding";

const routes = {
  "/": () => <Login />,
  "/login": () => <Login />,
  "/dashboard": () => <PublicDashboard />,
  "/register": () => <Register />
};

const SessionRouter = () => {
  const content = useRoutes(routes) || <Login />;
  return (
    <div className="bg-gray-100">
      <TopBar />
      <div className="p-4 container max-w-5xl mx-auto">{content}</div>
      <div className="bg-white app-footer">
        <div className="max-w-5xl mx-auto flex flex-col p-4">
          <div className="mx-auto p-2">
            <img
              className="h-20"
              src="https://care-coronasafe.s3.amazonaws.com/static/images/logos/ksdma_logo.png"
              alt="Care Logo"
            />
          </div>
          <div className="max-w-6xl text-sm">
            <a href="https://coronasafe.network/">
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
                (Github)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRouter;
