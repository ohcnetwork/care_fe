import careConfig from "@careConfig";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useEffect, useState } from "react";

import Loading from "@/components/Common/Loading";

import { AuthUserContext } from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import routes, { Type } from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";
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

  useEffect(() => {
    if (!user) {
      return;
    }

    updateRefreshToken(true);
    setInterval(
      () => updateRefreshToken(),
      careConfig.auth.tokenRefreshInterval,
    );
  }, [user]);

  const signIn = useCallback(
    async (creds: { username: string; password: string }) => {
      const query = await request(routes.login, { body: creds });

      if (query.res?.ok && query.data) {
        setAccessToken(query.data.access);
        localStorage.setItem(LocalStorageKeys.accessToken, query.data.access);
        localStorage.setItem(LocalStorageKeys.refreshToken, query.data.refresh);

        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

        if (location.pathname === "/" || location.pathname === "/login") {
          navigate(getRedirectOr("/"));
        }
      }

      return query;
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
    const accessToken = localStorage.getItem(LocalStorageKeys.accessToken);
    const refreshToken = localStorage.getItem(LocalStorageKeys.refreshToken);

    if (accessToken && refreshToken) {
      try {
        await mutate({
          ...routes.logout,
          TRes: Type<Record<string, never>>(),
        })({ access: accessToken, refresh: refreshToken });
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }

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

const updateRefreshToken = async (silent = false) => {
  const refresh = localStorage.getItem(LocalStorageKeys.refreshToken);

  if (!refresh) {
    return;
  }

  const { res, data } = await request(routes.token_refresh, {
    body: { refresh },
    silent,
  });

  if (res?.status !== 200 || !data) {
    localStorage.removeItem(LocalStorageKeys.accessToken);
    localStorage.removeItem(LocalStorageKeys.refreshToken);
    return;
  }

  localStorage.setItem(LocalStorageKeys.accessToken, data.access);
  localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);
};

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
