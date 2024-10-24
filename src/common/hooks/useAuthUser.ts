import { createContext, useContext } from "react";
import { UserModel } from "@/components/Users/models";
import { RequestResult } from "../../Utils/request/types";
import { JwtTokenObtainPair, LoginCredentials } from "../../Redux/api";

type SignInReturnType = RequestResult<JwtTokenObtainPair>;

type AuthContextType = {
  user: UserModel | undefined;
  refetchUser: () => Promise<RequestResult<UserModel>>;
  signIn: (creds: LoginCredentials) => Promise<SignInReturnType>;
  signOut: () => Promise<void>;
};

export const AuthUserContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
  const ctx = useContext(AuthUserContext);
  if (!ctx) {
    throw new Error(
      "'useAuthContext' must be used within 'AuthUserProvider' only",
    );
  }
  return ctx;
};

export default function useAuthUser() {
  const user = useAuthContext().user;
  if (!user) {
    throw new Error("'useAuthUser' must be used within 'AppRouter' only");
  }
  return user;
}
