import ManageUsers from "@/components/Users/ManageUsers";
import { UserAdd } from "@/components/Users/UserAdd";
import UserProfile from "@/components/Users/UserProfile";

import { AppRoutes } from "@/Routers/AppRouter";

const UserRoutes: AppRoutes = {
  "/users": () => <ManageUsers />,
  "/users/add": () => <UserAdd />,
  "/user/profile": () => <UserProfile />,
};

export default UserRoutes;
