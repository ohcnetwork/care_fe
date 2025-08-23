import { createContext, useContext } from "react";

import {
  LoginRequest,
  LoginResponse,
  MfaLoginRequest,
} from "@/types/auth/auth";
import { TokenData } from "@/types/auth/otp";
import { CurrentUserRead } from "@/types/user/user";

interface AuthContextType {
  user: CurrentUserRead | undefined;
  signIn: (creds: LoginRequest) => Promise<LoginResponse>;
  verifyMFA: (data: MfaLoginRequest) => Promise<LoginResponse>;
  isAuthenticating: boolean;
  isVerifyingMFA: boolean;
  signOut: () => Promise<void>;
  patientLogin: (tokenData: TokenData, redirectUrl: string) => void;
  patientToken: TokenData | null;
}

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
