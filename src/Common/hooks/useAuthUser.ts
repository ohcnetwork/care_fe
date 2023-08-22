import { createContext, useContext } from "react";
import { UserModel } from "../../Components/Users/models";

export const AuthUserContext = createContext<UserModel | null>(null);

export default function useAuthUser() {
  const user = useContext(AuthUserContext);

  if (!user) {
    throw new Error("useAuthUser must be used within an AuthUserProvider");
  }

  return user;
}
