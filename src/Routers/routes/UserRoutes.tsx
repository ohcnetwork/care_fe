import ManageUsers from "@/components/Users/ManageUsers";
import UserAdd from "@/components/Users/UserAdd";
import UserHome from "@/components/Users/UserHome";
import UserProfile from "@/components/Users/UserProfile";

import { AppRoutes } from "@/Routers/AppRouter";
import { getDefaultView } from "@/Utils/viewStorageUtils";

const UserRoutes: AppRoutes = {
  "/users": () => (
    <ManageUsers defaultView={getDefaultView("usersDefaultView", "card")} />
  ),
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
