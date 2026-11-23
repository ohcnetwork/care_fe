import careConfig from "@careConfig";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  clearOtherUsersFillDrafts,
  clearQuestionnaireFillDrafts,
  sweepExpiredFillDrafts,
} from "@/components/QuestionnaireV2/fill/draft/fillDraftCache";
import { AppearanceUserSync } from "@/context/AppearanceContext";

import { AuthUserContext } from "@/hooks/useAuthUser";

import { LocalStorageKeys } from "@/common/constants";

import { type AuthStatus, setAuthStatusResolver } from "@/lib/router/auth";
import { usePathname } from "@/lib/router/location";
import { navigate } from "@/lib/router/navigate";
import { getRouter } from "@/lib/router/routerRef";

import mutate from "@/Utils/request/mutate";
import query, { callApi } from "@/Utils/request/query";
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
}

const isMFAResponse = (data: LoginResponse): data is MfaAuthenticationToken => {
  return "temp_token" in data;
};

const isJwtTokenResponse = (
  data: LoginResponse,
): data is JwtTokenObtainPair => {
  return "access" in data && "refresh" in data;
};

/**
 * The session status from the provider's token state and the query cache.
 * It matches what the provider renders, but it is read synchronously, so a
 * route guard sees a sign-in or sign-out before React re-renders.
 */
function readAuthStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  accessToken: string | null,
  patientToken: TokenData | null,
): AuthStatus {
  if (accessToken) {
    const state = queryClient.getQueryState(["currentUser", accessToken]);
    if (state?.data) return "user";
    const enabled = !!localStorage.getItem(LocalStorageKeys.accessToken);
    if (enabled && (!state || state.status === "pending")) return "loading";
  }
  return patientToken?.token ? "patient" : "anonymous";
}

/**
 * Owns the staff and patient sessions. The router reads the session status
 * for its route guards (see `src/lib/router/auth.ts`); the root route shows
 * the loading screen and selects the chrome.
 */
export default function AuthUserProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessTokenState] = useState(
    localStorage.getItem(LocalStorageKeys.accessToken),
  );
  const path = usePathname();
  const [patientToken, setPatientTokenState] = useState<TokenData | null>(
    JSON.parse(
      localStorage.getItem(LocalStorageKeys.patientTokenKey) || "null",
    ),
  );

  // Mirrors of the token state, updated in the same call as the state, so
  // `readAuthStatus` is current before the next render.
  const accessTokenRef = useRef(accessToken);
  const patientTokenRef = useRef(patientToken);
  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    setAccessTokenState(token);
  }, []);
  const setPatientToken = useCallback((token: TokenData | null) => {
    patientTokenRef.current = token;
    setPatientTokenState(token);
  }, []);
  useState(() =>
    setAuthStatusResolver(() =>
      readAuthStatus(
        queryClient,
        accessTokenRef.current,
        patientTokenRef.current,
      ),
    ),
  );

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser", accessToken],
    queryFn: query(userApi.currentUser, { silent: true }),
    retry: false,
    enabled: !!localStorage.getItem(LocalStorageKeys.accessToken),
  });

  // Same precedence the app used to select a router: staff, patient, public.
  const status: AuthStatus = isLoading
    ? "loading"
    : user
      ? "user"
      : patientToken?.token
        ? "patient"
        : "anonymous";

  // Run the route guards again when the session changes without a
  // navigation (sign-in finished loading, sign-out, a token removed in
  // another tab).
  const lastStatus = useRef(status);
  useLayoutEffect(() => {
    if (lastStatus.current === status) return;
    lastStatus.current = status;
    void getRouter().invalidate();
  }, [status]);

  const setUser = useSetAtom(userAtom);
  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  // Boot-time housekeeping — drop any fill drafts that outlived their TTL,
  // regardless of which user (or logged-out session) wrote them. Fresh
  // drafts (e.g. one saved from the login form) are left alone.
  useEffect(() => {
    sweepExpiredFillDrafts();
  }, []);

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
      // Tokens only — this query has retry:false, so a single transient
      // network blip trips this branch. Clearing drafts here would
      // destroy exactly the recovery scenario this feature exists for
      // (a phone call blocking the network mid-refresh); signOut() is the
      // deliberate, user-initiated place drafts get wiped on session end.
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

  // The freshly-issued tokens are in localStorage by the time this runs,
  // but the `user` in scope here is still last render's (possibly none) —
  // fetch the identity behind the NEW tokens directly rather than wait on
  // the query hook's next render, so the draft clear below can be scoped
  // to this exact account at the earliest point it is known, strictly
  // after credentials were accepted.
  const clearOtherUsersDrafts = useCallback(async () => {
    try {
      const currentUser = await callApi(userApi.currentUser, {
        silent: true,
      });
      clearOtherUsersFillDrafts(currentUser.id);
    } catch {
      // Best-effort — an identity lookup failing here must not block
      // sign-in. Worst case a different user's stale draft lingers until
      // the next successful login or the boot-time expiry sweep.
    }
  }, []);

  const { mutateAsync: signIn, isPending: isAuthenticating } = useMutation({
    mutationFn: mutate(authApi.login),
    onSuccess: async (data: LoginResponse) => {
      queryClient.invalidateQueries({ queryKey: ["enabled-plugins"] });
      if (isMFAResponse(data)) {
        localStorage.setItem("mfa_temp_token", data.temp_token);
        const redirectURL = getRedirectURL();
        const directURL = path !== "/login" ? window.location.href : null;
        navigate({
          href: redirectURL
            ? `/2fa?redirect=${redirectURL}`
            : directURL
              ? `/2fa?redirect=${directURL}`
              : "/2fa",
        });
        return;
      }

      if (isJwtTokenResponse(data)) {
        setAccessToken(data.access);
        localStorage.setItem(LocalStorageKeys.accessToken, data.access);
        localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);
        // Credentials are accepted — a draft left at the login form by a
        // DIFFERENT account (e.g. a session expiry on a shared machine)
        // must not survive into this session. A draft belonging to the
        // account that just signed in is the recovery case this feature
        // exists for, so it must survive.
        await clearOtherUsersDrafts();

        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        if (path === "/" || path === "/login") {
          navigate({ href: getRedirectOr("/") });
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
      // Same rule as the direct JWT success branch above — the 2FA step
      // just completed, so this is the first point credentials are fully
      // accepted.
      await clearOtherUsersDrafts();

      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      navigate({ href: getRedirectOr("/") });
    },
  });

  const patientLogin = useCallback(
    (tokenData: TokenData, redirectUrl: string) => {
      setPatientToken(tokenData);
      localStorage.setItem(
        LocalStorageKeys.patientTokenKey,
        JSON.stringify(tokenData),
      );
      navigate({ href: redirectUrl });
    },
    [setPatientToken],
  );

  /**
   * End the session and return to the login form. `clearDrafts` separates a
   * DELIBERATE sign-out (the user menu's Log out — drafts are session data
   * and must not outlive it) from the involuntary paths that end a session
   * without the user asking for it: the session-expired page and the
   * cross-tab storage listener below, which fires in every OTHER tab off
   * the token-refresh error branch above (retry:false, so a single network
   * blip trips it). Wiping there destroys exactly the work fill drafts
   * exist to recover — a draft left at the login form by an expiry survives
   * re-login on purpose. Shared-device protection does not depend on this:
   * `clearOtherUsersFillDrafts` runs at the next successful login and the
   * TTL sweep at every boot.
   */
  const endSession = useCallback(
    async (clearDrafts: boolean) => {
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
      if (clearDrafts) clearQuestionnaireFillDrafts();
      setAccessToken(null);
      setPatientToken(null);

      await queryClient.resetQueries({ queryKey: ["currentUser"] });

      const redirectURL = getRedirectURL();
      navigate({
        href: redirectURL ? `/login?redirect=${redirectURL}` : "/login",
      });
    },
    [queryClient, setAccessToken, setPatientToken],
  );

  const signOut = useCallback(() => endSession(true), [endSession]);
  const endSessionKeepingDrafts = useCallback(
    () => endSession(false),
    [endSession],
  );

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
        // A token key disappearing elsewhere is not proof of intent: the
        // token-refresh error branch removes the same keys on one transient
        // failure. The tab that ACTUALLY ran the deliberate sign-out already
        // cleared the drafts.
        endSessionKeepingDrafts();
      }
    };

    addEventListener("storage", listener);

    return () => {
      removeEventListener("storage", listener);
    };
  }, [endSessionKeepingDrafts]);

  const contextValue = useMemo(
    () => ({
      signIn,
      signOut,
      endSessionKeepingDrafts,
      verifyMFA,
      isAuthenticating,
      isVerifyingMFA,
      user,
      patientLogin,
      patientToken,
      isUserLoading: isLoading,
    }),
    [
      signIn,
      signOut,
      endSessionKeepingDrafts,
      verifyMFA,
      isAuthenticating,
      isVerifyingMFA,
      user,
      patientLogin,
      patientToken,
      isLoading,
    ],
  );

  return (
    <AuthUserContext.Provider value={contextValue}>
      <AppearanceUserSync user={accessToken ? user : undefined} />
      {children}
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
