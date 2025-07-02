import careConfig from "@careConfig";
import {
  onlineManager,
  useIsRestoring,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { navigate } from "raviger";
import { useCallback, useEffect, useState } from "react";

import Loading from "@/components/Common/Loading";

import { AuthUserContext } from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import { createUserPersister } from "@/OfflineSupport/createUserPersister";
import useNetworkStatus from "@/Utils/networkstatus";
import routes, {
  JwtTokenObtainPair,
  LoginResponse,
  Type,
} from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { userAtom } from "@/atoms/user-atom";
import authApi from "@/types/auth/authApi";
import { MFAAuthenticationToken, TokenData } from "@/types/auth/otp";

interface Props {
  children: React.ReactNode;
  unauthorized: React.ReactNode;
  otpAuthorized: React.ReactNode;
}

const isMFAResponse = (data: LoginResponse): data is MFAAuthenticationToken => {
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
  const isrestoring = useIsRestoring();
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(LocalStorageKeys.accessToken),
  );
  const [patientToken, setPatientToken] = useState<TokenData | null>(
    JSON.parse(
      localStorage.getItem(LocalStorageKeys.patientTokenKey) || "null",
    ),
  );
  const { isChecked } = useNetworkStatus();
  const { data: onlineuser, isLoading } = useQuery({
    queryKey: ["currentUser", accessToken],
    queryFn: query(routes.currentUser, { silent: true }),
    retry: false,
    networkMode: "online",
    meta: { persist: true },
    enabled:
      !!localStorage.getItem(LocalStorageKeys.accessToken) && !!isChecked,
  });

  const { data: offlineUser } = useQuery({
    queryKey: ["offlineCurrentUser"],
    queryFn: async () => {
      throw new Error("Should not fetch online");
    },
    meta: { persist: true },
    networkMode: "online",
    enabled: false,
  });

  useEffect(() => {
    if (onlineuser) {
      queryClient.setQueryData(["offlineCurrentUser"], onlineuser);
    }
  }, [onlineuser, queryClient]);

  const setUser = useSetAtom(userAtom);
  useEffect(() => {
    if (
      !onlineManager.isOnline() &&
      localStorage.getItem(LocalStorageKeys.accessToken) &&
      offlineUser
    ) {
      setUser(offlineUser);
    } else {
      setUser(onlineuser);
    }
  }, [onlineuser, offlineUser, setUser]);
  const refreshToken = localStorage.getItem(LocalStorageKeys.refreshToken);

  const tokenRefreshQuery = useQuery({
    queryKey: ["user-refresh-token"],
    queryFn: query(routes.token_refresh, {
      body: { refresh: refreshToken || "" },
    }),
    meta: { persist: true },
    networkMode: "online",
    refetchIntervalInBackground: true,
    refetchInterval: careConfig.auth.tokenRefreshInterval,
    enabled: !!refreshToken && !!onlineuser && !!isChecked,
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
    mutationFn: mutate(routes.login),
    onSuccess: async (data: LoginResponse) => {
      if (isMFAResponse(data)) {
        localStorage.setItem("mfa_temp_token", data.temp_token);
        const redirectURL = getRedirectURL();
        navigate(redirectURL ? `/2fa?redirect=${redirectURL}` : "/2fa");
        return;
      }

      if (isJwtTokenResponse(data)) {
        setAccessToken(data.access);
        localStorage.setItem(LocalStorageKeys.accessToken, data.access);
        localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);

        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

        if (location.pathname === "/" || location.pathname === "/login") {
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
    await createUserPersister().removeClient();
    await queryClient.resetQueries({ queryKey: ["offlineCurrentUser"] });

    if (accessToken && refreshToken) {
      console.log("befor logout api call");
      try {
        await mutate({
          ...routes.logout,
          TRes: Type<Record<string, never>>(),
        })({ access: accessToken, refresh: refreshToken });
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
    await queryClient.resetQueries({ queryKey: ["currentUser"] });
    queryClient.clear();
    console.log("after logout mutate");
    localStorage.removeItem(LocalStorageKeys.accessToken);
    localStorage.removeItem(LocalStorageKeys.refreshToken);
    localStorage.removeItem(LocalStorageKeys.patientTokenKey);
    setAccessToken(null);
    setPatientToken(null);

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

  console.log(
    "isloading",
    isLoading,
    "isrestoring",
    isrestoring,
    "isChecked",
    isChecked,
    "online user:",
    onlineuser,
    "offlineuser : ",
    offlineUser,
  );

  if (isLoading || isrestoring || !isChecked) {
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
        user: onlineuser ? onlineuser : offlineUser,
        patientLogin,
        patientToken,
      }}
    >
      {(onlineuser ? onlineuser : offlineUser)
        ? children
        : patientToken?.token
          ? otpAuthorized
          : unauthorized}
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
