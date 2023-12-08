import { createContext, useContext } from "react";
import { UserModel } from "../../Components/Users/models";
import { RequestResult } from "../../Utils/request/types";
import { JwtTokenObtainPair, LoginCredentials } from "../../Redux/api";

type SignInReturnType = RequestResult<JwtTokenObtainPair>;

type AuthContextType = {
  user: UserModel | undefined;
  signIn: (creds: LoginCredentials) => Promise<SignInReturnType>;
  signOut: () => Promise<void>;
};

export const AuthUserContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
  const ctx = useContext(AuthUserContext);
  if (!ctx) {
    throw new Error("useAuthUser must be used within an AuthUserProvider");
  }
  return ctx;
};

export default function useAuthUser() {
  return useAuthContext().user;
}
