import ManageUsers from "../../Components/Users/ManageUsers";
import { UserAdd } from "../../Components/Users/UserAdd";
import UserProfile from "../../Components/Users/UserProfile";

export default {
  "/users": () => <ManageUsers />,
  "/users/add": () => <UserAdd />,
  "/user/profile": () => <UserProfile />,
};
