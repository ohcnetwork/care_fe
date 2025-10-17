import careConfig from "@careConfig";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { navigate, usePath } from "raviger";
import { useCallback, useEffect, useState } from "react";

import Loading from "@/components/Common/Loading";

import { AuthUserContext } from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { userAtom } from "@/atoms/user-atom";
import {
  JwtTokenObtainPair,
  LoginResponse,
  MfaAuthenticationToken,
} from "@/types/auth/auth";
import authApi from "@/types/auth/authApi";
import { TokenData } from "@/types/otp/otp";
import userApi from "@/types/user/userApi";

interface Props {
  children: React.ReactNode;
  unauthorized: React.ReactNode;
  otpAuthorized: React.ReactNode;
}

const isMFAResponse = (data: LoginResponse): data is MfaAuthenticationToken => {
  return "temp_token" in data;
};

const isJwtTokenResponse = (
  data: LoginResponse,
): data is JwtTokenObtainPair => {
  return "access" in data && "refresh" in data;
};

export default function AuthUserProvider({
  children,
  unauthorized,
  otpAuthorized,
}: Props) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(LocalStorageKeys.accessToken),
  );
  const path = usePath();
  const [patientToken, setPatientToken] = useState<TokenData | null>(
    JSON.parse(
      localStorage.getItem(LocalStorageKeys.patientTokenKey) || "null",
    ),
  );

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser", accessToken],
    queryFn: query(userApi.currentUser, { silent: true }),
    retry: false,
    enabled: !!localStorage.getItem(LocalStorageKeys.accessToken),
  });

  const setUser = useSetAtom(userAtom);
  useEffect(() => {
    setUser(user);
  }, [user, setUser]);
  const refreshToken = localStorage.getItem(LocalStorageKeys.refreshToken);

  const tokenRefreshQuery = useQuery({
    queryKey: ["user-refresh-token"],
    queryFn: query(authApi.tokenRefresh, {
      body: { refresh: refreshToken || "" },
    }),
    refetchIntervalInBackground: true,
    refetchInterval: careConfig.auth.tokenRefreshInterval,
    enabled: !!refreshToken && !!user,
  });

  useEffect(() => {
    if (tokenRefreshQuery.isError) {
      localStorage.removeItem(LocalStorageKeys.accessToken);
      localStorage.removeItem(LocalStorageKeys.refreshToken);
      return;
    }

    if (tokenRefreshQuery.data) {
      const { access, refresh } = tokenRefreshQuery.data;
      localStorage.setItem(LocalStorageKeys.accessToken, access);
      localStorage.setItem(LocalStorageKeys.refreshToken, refresh);
    }
  }, [tokenRefreshQuery.data, tokenRefreshQuery.isError]);

  const { mutateAsync: signIn, isPending: isAuthenticating } = useMutation({
    mutationFn: mutate(authApi.login),
    onSuccess: async (data: LoginResponse) => {
      if (isMFAResponse(data)) {
        localStorage.setItem("mfa_temp_token", data.temp_token);
        const redirectURL = getRedirectURL();
        const directURL = path !== "/login" ? window.location.href : null;
        navigate(
          redirectURL
            ? `/2fa?redirect=${redirectURL}`
            : directURL
              ? `/2fa?redirect=${directURL}`
              : "/2fa",
        );
        return;
      }

      if (isJwtTokenResponse(data)) {
        setAccessToken(data.access);
        localStorage.setItem(LocalStorageKeys.accessToken, data.access);
        localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);

        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        if (path === "/" || path === "/login") {
          navigate(getRedirectOr("/"));
        }
      }
    },
  });

  const { mutateAsync: verifyMFA, isPending: isVerifyingMFA } = useMutation({
    mutationFn: mutate(authApi.mfa.login),
    onSuccess: async (data: JwtTokenObtainPair) => {
      localStorage.removeItem("mfa_temp_token");

      setAccessToken(data.access);
      localStorage.setItem(LocalStorageKeys.accessToken, data.access);
      localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);

      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      navigate(getRedirectOr("/"));
    },
  });

  const patientLogin = (tokenData: TokenData, redirectUrl: string) => {
    setPatientToken(tokenData);
    localStorage.setItem(
      LocalStorageKeys.patientTokenKey,
      JSON.stringify(tokenData),
    );
    navigate(redirectUrl);
  };

  const signOut = useCallback(async () => {
    const accessToken = localStorage.getItem(LocalStorageKeys.accessToken);
    const refreshToken = localStorage.getItem(LocalStorageKeys.refreshToken);

    if (accessToken && refreshToken) {
      try {
        await mutate(authApi.logout)({
          access: accessToken,
          refresh: refreshToken,
        });
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }

    localStorage.removeItem(LocalStorageKeys.accessToken);
    localStorage.removeItem(LocalStorageKeys.refreshToken);
    localStorage.removeItem(LocalStorageKeys.patientTokenKey);
    setAccessToken(null);
    setPatientToken(null);

    await queryClient.resetQueries({ queryKey: ["currentUser"] });

    const redirectURL = getRedirectURL();
    navigate(redirectURL ? `/login?redirect=${redirectURL}` : "/login");
  }, [queryClient]);

  // Handles signout from current tab, if signed out from another tab.
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (
        !event.newValue &&
        event.key &&
        [
          LocalStorageKeys.accessToken,
          LocalStorageKeys.refreshToken,
          LocalStorageKeys.patientTokenKey,
        ].includes(event.key)
      ) {
        signOut();
      }
    };

    addEventListener("storage", listener);

    return () => {
      removeEventListener("storage", listener);
    };
  }, [signOut]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <AuthUserContext.Provider
      value={{
        signIn,
        signOut,
        verifyMFA,
        isAuthenticating,
        isVerifyingMFA,
        user,
        patientLogin,
        patientToken,
      }}
    >
      {user ? children : patientToken?.token ? otpAuthorized : unauthorized}
    </AuthUserContext.Provider>
  );
}

const getRedirectURL = () => {
  return new URLSearchParams(window.location.search).get("redirect");
};

const getRedirectOr = (fallback: string) => {
  const url = getRedirectURL();

  if (url) {
    try {
      const redirect = new URL(url);
      if (window.location.origin === redirect.origin) {
        return redirect.pathname + redirect.search;
      }
      console.error("Redirect does not belong to same origin.");
    } catch {
      console.error(`Invalid redirect URL: ${url}`);
    }
  }

  return fallback;
};
