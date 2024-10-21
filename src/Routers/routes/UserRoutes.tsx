import ManageUsers from "../../Components/Users/ManageUsers";
import { UserAdd } from "../../Components/Users/UserAdd";
import UserProfile from "../../Components/Users/UserProfile";
import { AppRoutes } from "../AppRouter";

const UserRoutes: AppRoutes = {
  "/users": () => <ManageUsers />,
  "/users/add": () => <UserAdd />,
  "/user/profile": () => <UserProfile />,
};

export default UserRoutes;
