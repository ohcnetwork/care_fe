import ManageUsers from "@/components/Users/ManageUsers";
import UserAdd from "@/components/Users/UserAdd";
import UserHome from "@/components/Users/UserHome";
import UserProfile from "@/components/Users/UserProfile";

import { AppRoutes } from "@/Routers/AppRouter";

const UserRoutes: AppRoutes = {
  "/users": () => <ManageUsers />,
  "/users/add": () => <UserAdd />,
  "/users/:username": ({ username }) => (
    <UserHome username={username} tab={"profile"} />
  ),
  "/users/:username/:tab": ({ username, tab }) => (
    <UserHome username={username} tab={tab} />
  ),
  "/user/profile": () => <UserProfile />,
};

export default UserRoutes;
