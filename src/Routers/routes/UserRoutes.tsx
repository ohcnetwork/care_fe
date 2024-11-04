import ManageUsers from "@/components/Users/ManageUsers";
import { UserAdd } from "@/components/Users/UserAdd";
import UserProfile from "@/components/Users/UserProfile";
import { AppRoutes } from "../AppRouter";
import UserHome from "@/components/Users/UserHome";

const UserRoutes: AppRoutes = {
  "/users": () => <ManageUsers />,
  "/users/detail/:username": ({ username }) => (
    <UserHome username={username} tab={"profile"} />
  ),
  "/users/detail/:username/:tab": ({ username, tab }) => (
    <UserHome username={username} tab={tab} />
  ),
  "/users/add": () => <UserAdd />,
  "/user/profile": () => <UserProfile />,
};

export default UserRoutes;
