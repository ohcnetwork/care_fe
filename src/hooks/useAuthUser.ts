import { createContext, useContext } from "react";

import {
  LoginRequest,
  LoginResponse,
  MfaLoginRequest,
} from "@/types/auth/auth";
import { TokenData } from "@/types/otp/otp";
import { CurrentUserRead } from "@/types/user/user";

export interface AuthContextType {
  user: CurrentUserRead | undefined;
  signIn: (creds: LoginRequest) => Promise<LoginResponse>;
  verifyMFA: (data: MfaLoginRequest) => Promise<LoginResponse>;
  isAuthenticating: boolean;
  isVerifyingMFA: boolean;
  /** Deliberate sign-out — also clears local questionnaire fill drafts. */
  signOut: () => Promise<void>;
  /** Same session teardown for the INVOLUNTARY paths (session expiry, a
   *  cross-tab token removal), which leave fill drafts in place so work
   *  interrupted by an expiry can be recovered after re-login. */
  endSessionKeepingDrafts: () => Promise<void>;
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
