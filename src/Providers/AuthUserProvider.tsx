import careConfig from "@careConfig";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useEffect, useState } from "react";

import Loading from "@/components/Common/Loading";

import { AuthUserContext } from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { TokenData } from "@/types/auth/otpToken";

interface Props {
  children: React.ReactNode;
  unauthorized: React.ReactNode;
  otpAuthorized: React.ReactNode;
}

export default function AuthUserProvider({
  children,
  unauthorized,
  otpAuthorized,
}: Props) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem(LocalStorageKeys.accessToken),
  );
  const [patientToken, setPatientToken] = useState<TokenData | null>(
    JSON.parse(
      localStorage.getItem(LocalStorageKeys.patientTokenKey) || "null",
    ),
  );

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser", accessToken],
    queryFn: query(routes.currentUser, { silent: true }),
    retry: false,
    enabled: !!localStorage.getItem(LocalStorageKeys.accessToken),
  });

  const refresh = localStorage.getItem(LocalStorageKeys.refreshToken);

  const { data: refreshTokenData, error: refreshTokenError } = useQuery({
    queryKey: ["user-refresh-token"],
    queryFn: query(routes.token_refresh, { body: { refresh: refresh || "" } }),
    refetchInterval: careConfig.auth.tokenRefreshInterval,
    enabled: !!refresh,
  });
  if (refreshTokenError) {
    localStorage.removeItem(LocalStorageKeys.accessToken);
    localStorage.removeItem(LocalStorageKeys.refreshToken);
  }
  if (refreshTokenData) {
    localStorage.setItem(LocalStorageKeys.accessToken, refreshTokenData.access);
    localStorage.setItem(
      LocalStorageKeys.refreshToken,
      refreshTokenData.refresh,
    );
  }
  useEffect(() => {
    if (!user) {
      return;
    }
  }, [user]);

  const { mutateAsync: signInMutate } = useMutation({
    mutationFn: mutate(routes.login),
  });

  const signIn = useCallback(
    async (creds: { username: string; password: string }) => {
      const data = await signInMutate(creds);

      if (data?.access && data?.refresh) {
        setAccessToken(data.access);
        localStorage.setItem(LocalStorageKeys.accessToken, data.access);
        localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);

        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

        if (location.pathname === "/" || location.pathname === "/login") {
          navigate(getRedirectOr("/"));
        }
      }

      return data;
    },
    [queryClient],
  );

  const patientLogin = (tokenData: TokenData, redirectUrl: string) => {
    setPatientToken(tokenData);
    localStorage.setItem(
      LocalStorageKeys.patientTokenKey,
      JSON.stringify(tokenData),
    );
    navigate(redirectUrl);
  };

  const signOut = useCallback(async () => {
    localStorage.removeItem(LocalStorageKeys.accessToken);
    localStorage.removeItem(LocalStorageKeys.refreshToken);
    localStorage.removeItem(LocalStorageKeys.patientTokenKey);
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

  const SelectedRouter = () => {
    if (user) {
      return children;
    } else if (patientToken?.token) {
      return otpAuthorized;
    } else {
      return unauthorized;
    }
  };

  return (
    <AuthUserContext.Provider
      value={{
        signIn,
        signOut,
        user,
        patientLogin,
        patientToken,
      }}
    >
      <SelectedRouter />
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
