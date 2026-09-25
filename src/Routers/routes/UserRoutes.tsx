import { lazy } from "react";

import type { AppRoutes } from "@/Routers/AppRouter";

const UserHome = lazy(() => import("@/components/Users/UserHome"));

const UserRoutes: AppRoutes = {
  "/facility/:facilityId/users/:username": ({ facilityId, username }) => (
    <UserHome facilityId={facilityId} username={username} tab="profile" />
  ),
  "/facility/:facilityId/users/:username/:tab": ({
    facilityId,
    username,
    tab,
  }) => <UserHome facilityId={facilityId} username={username} tab={tab} />,
  "/users/:username": ({ username }) => (
    <UserHome username={username} tab="profile" />
  ),
  "/users/:username/:tab": ({ username, tab }) => (
    <UserHome username={username} tab={tab} />
  ),
  "/user/:tab": ({ tab }) => <UserHome tab={tab} />,
};

export default UserRoutes;
