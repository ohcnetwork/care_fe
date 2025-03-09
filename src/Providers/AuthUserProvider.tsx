import careConfig from "@careConfig";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useEffect, useState } from "react";

import Loading from "@/components/Common/Loading";

import { AuthUserContext } from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import routes, {
  JwtTokenObtainPair,
  LoginResponse,
  Type,
} from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import authApi from "@/types/auth/authApi";
import { MFAResponse, TokenData } from "@/types/auth/otp";

interface Props {
  children: React.ReactNode;
  unauthorized: React.ReactNode;
  otpAuthorized: React.ReactNode;
}

const isMFAResponse = (data: LoginResponse): data is MFAResponse => {
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

  const refreshToken = localStorage.getItem(LocalStorageKeys.refreshToken);

  const tokenRefreshQuery = useQuery({
    queryKey: ["user-refresh-token"],
    queryFn: query(routes.token_refresh, {
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
    mutationFn: mutate(routes.login),
    onSuccess: async (data: LoginResponse) => {
      // Handle MFA cases
      if (isMFAResponse(data)) {
        localStorage.setItem("mfa_temp_token", data.temp_token);
        localStorage.setItem("mfa_method", "totp");
        navigate("/authenticate");
        return;
      }

      // Handle normal login with JWT tokens
      if (isJwtTokenResponse(data)) {
        setAccessToken(data.access);
        localStorage.setItem(LocalStorageKeys.accessToken, data.access);
        localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);

        // Invalidate and wait for the currentUser query to complete
        try {
          await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
          await queryClient.refetchQueries({ queryKey: ["currentUser"] });
        } catch (error) {
          console.error("Error refreshing currentUser query:", error);
        }

        if (location.pathname === "/" || location.pathname === "/login") {
          navigate(getRedirectOr("/"));
        }
      }
    },
  });

  const { mutateAsync: verifyMFA, isPending: isVerifyingMFA } = useMutation({
    mutationFn: mutate(authApi.mfa.login),
    onSuccess: async (data: JwtTokenObtainPair) => {
      // Clear MFA related data
      localStorage.removeItem("mfa_temp_token");
      localStorage.removeItem("mfa_method");

      // Set new tokens
      setAccessToken(data.access);
      localStorage.setItem(LocalStorageKeys.accessToken, data.access);
      localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);

      // Invalidate and wait for the currentUser query to complete
      try {
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        await queryClient.refetchQueries({ queryKey: ["currentUser"] });
      } catch (error) {
        console.error("Error refreshing currentUser query:", error);
      }

      // Get redirect URL from query params or localStorage
      const redirectURL = getRedirectURL() || "/";
      navigate(redirectURL);
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
