import ManageUsers from "@/components/Users/ManageUsers";
import { UserAdd } from "@/components/Users/UserAdd";
import UserProfile from "@/components/Users/UserProfile";
import { AppRoutes } from "../AppRouter";
import UserHome from "@/components/Users/UserHome";

const UserRoutes: AppRoutes = {
  "/users": () => <ManageUsers />,
  "/users/add": () => <UserAdd />,
  "/users/edit/:username": ({ username }) => <UserAdd username={username} />,
  "/users/:username": ({ username }) => (
    <UserHome username={username} tab={"profile"} />
  ),
  "/users/:username/:tab": ({ username, tab }) => (
    <UserHome username={username} tab={tab} />
  ),
  "/user/profile": () => <UserProfile />,
};

export default UserRoutes;
