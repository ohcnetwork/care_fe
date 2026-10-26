import { useQueryClient } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { callApi } from "@/Utils/request/query";
import { getAuthorizationHeader } from "@/Utils/request/utils";
import { CurrentUserRead } from "@/types/user/user";
import userApi from "@/types/user/userApi";

export type AppearanceTheme = "light" | "light-protanopia" | "light-tritanopia";
export type AppearanceFontSize = "small" | "default" | "large" | "larger";
export type AppearanceMotion = "system" | "reduce" | "allow";

export interface AppearancePreferences {
  theme: AppearanceTheme;
  font_size: AppearanceFontSize;
  high_contrast: boolean;
  motion: AppearanceMotion;
}

const DEFAULT_PREFERENCES: AppearancePreferences = {
  theme: "light",
  font_size: "default",
  high_contrast: false,
  motion: "system",
};
const FONT_SIZE_SCALE: Record<AppearanceFontSize, number> = {
  small: 0.875,
  default: 1,
  large: 1.125,
  larger: 1.25,
};
const FONT_SIZES: readonly string[] = Object.keys(FONT_SIZE_SCALE);
const MOTION_PREFERENCES: readonly string[] = ["system", "reduce", "allow"];
const CACHE_PREFIX = "care.appearance.v1:";

type AppearanceUser = Pick<CurrentUserRead, "id" | "preferences">;

interface AppearanceState {
  preferences: AppearancePreferences;
  isSaving: boolean;
  saveError: boolean;
}
interface AppearanceContextValue extends AppearanceState {
  resolvedTheme: "light" | "dark";
  reducedMotion: boolean;
  systemPrefersReduced: boolean;
  updatePreferences: (update: Partial<AppearancePreferences>) => void;
  retrySave: () => void;
}
interface AppearanceSession {
  userId: string | null;
  preferences: AppearancePreferences;
  pending: boolean;
  running: boolean;
  failed: boolean;
  authorization: string | null;
  controller: AbortController | null;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);
const AppearanceSyncContext = createContext<
  ((user: AppearanceUser | undefined) => void) | null
>(null);

function effectiveTheme(value: unknown): AppearanceTheme | undefined {
  // Older saved preferences remain on the account until the user makes a change.
  // Only their light equivalents are available while dark themes are disabled.
  switch (value) {
    case "light":
    case "dark":
    case "system":
      return "light";
    case "light-protanopia":
    case "dark-protanopia":
      return "light-protanopia";
    case "light-tritanopia":
    case "dark-tritanopia":
      return "light-tritanopia";
    default:
      return undefined;
  }
}

function validatedPreferences(value: unknown): Partial<AppearancePreferences> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const result: Partial<AppearancePreferences> = {};
  const theme = effectiveTheme(record.theme);
  if (theme) result.theme = theme;
  if (
    typeof record.font_size === "string" &&
    FONT_SIZES.includes(record.font_size)
  ) {
    result.font_size = record.font_size as AppearanceFontSize;
  }
  if (typeof record.high_contrast === "boolean") {
    result.high_contrast = record.high_contrast;
  }
  if (
    typeof record.motion === "string" &&
    MOTION_PREFERENCES.includes(record.motion)
  ) {
    result.motion = record.motion as AppearanceMotion;
  }
  return result;
}

function equalPreferences(a: AppearancePreferences, b: AppearancePreferences) {
  return (
    a.theme === b.theme &&
    a.font_size === b.font_size &&
    a.high_contrast === b.high_contrast &&
    a.motion === b.motion
  );
}

function readCachedPreferences(userId: string) {
  try {
    return validatedPreferences(
      JSON.parse(localStorage.getItem(`${CACHE_PREFIX}${userId}`) ?? "null"),
    );
  } catch {
    return {};
  }
}

function preferencesForUser(user: AppearanceUser): AppearancePreferences {
  // A returned preference object is authoritative, including reset/invalid fields.
  // The account cache is only a fallback when an older response omits this key.
  const stored = user.preferences?.appearance;
  return {
    ...DEFAULT_PREFERENCES,
    ...(stored === undefined
      ? readCachedPreferences(user.id)
      : validatedPreferences(stored)),
  };
}

function cachePreferences(userId: string, preferences: AppearancePreferences) {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${userId}`,
      JSON.stringify(preferences),
    );
  } catch {
    // Account persistence still works when this browser disallows local storage.
  }
}

function createSession(
  userId: string | null,
  preferences: AppearancePreferences,
): AppearanceSession {
  return {
    userId,
    preferences,
    pending: false,
    running: false,
    failed: false,
    authorization: null,
    controller: null,
  };
}

function subscribeMedia(query: string, callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const subscribeReducedMotion = (callback: () => void) =>
  subscribeMedia("(prefers-reduced-motion: reduce)", callback);
const reducedMotionSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMediaSnapshot = () => false;

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionRef = useRef(createSession(null, DEFAULT_PREFERENCES));
  const [state, setState] = useState<AppearanceState>({
    preferences: DEFAULT_PREFERENCES,
    isSaving: false,
    saveError: false,
  });
  const systemPrefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    serverMediaSnapshot,
  );

  const publish = useCallback((session: AppearanceSession) => {
    if (sessionRef.current !== session) return;
    setState({
      preferences: session.preferences,
      isSaving: session.running,
      saveError: session.failed,
    });
  }, []);

  const save = useCallback(
    async (session: AppearanceSession) => {
      if (
        sessionRef.current !== session ||
        !session.userId ||
        session.running ||
        session.failed ||
        !session.pending
      )
        return;
      session.running = true;
      publish(session);
      try {
        const authorization = getAuthorizationHeader();
        if (!authorization) throw new Error("No authenticated session");
        if (authorization !== session.authorization) {
          // A refreshed token is valid only after confirming it still owns this draft.
          session.controller = new AbortController();
          const owner = await callApi(
            { ...userApi.currentUser, noAuth: true },
            {
              headers: { Authorization: authorization },
              signal: session.controller.signal,
              silent: true,
            },
          );
          if (sessionRef.current !== session) return;
          if (owner.id !== session.userId) throw new Error("Account changed");
          session.authorization = authorization;
        }
        while (sessionRef.current === session && session.pending) {
          const preferences = { ...session.preferences };
          session.pending = false;
          session.controller = new AbortController();
          if (!session.authorization)
            throw new Error("No authenticated session");
          // Bind queued requests to their owner, even if another account signs in.
          await callApi(
            { ...userApi.setPreferences, noAuth: true },
            {
              headers: { Authorization: session.authorization },
              signal: session.controller.signal,
              silent: true,
              body: {
                preference: "appearance",
                version: "0.0.1",
                value: { ...preferences },
              },
            },
          );
          if (sessionRef.current !== session) return;
          cachePreferences(session.userId, preferences);
          session.pending = !equalPreferences(session.preferences, preferences);
        }
        if (sessionRef.current !== session) return;
        session.running = false;
        session.controller = null;
        publish(session);
        // The endpoint returns an empty 201, not the current-user object.
        await queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      } catch {
        if (sessionRef.current !== session) return;
        session.running = false;
        session.controller = null;
        session.pending = true;
        session.failed = true;
        publish(session);
      }
    },
    [publish, queryClient],
  );

  const syncUser = useCallback(
    (user: AppearanceUser | undefined) => {
      const current = sessionRef.current;
      const userId = user?.id ?? null;
      if (current.userId !== userId) {
        current.controller?.abort();
        // Never apply another account's cache to the login or patient portal.
        const preferences = user
          ? preferencesForUser(user)
          : DEFAULT_PREFERENCES;
        const next = createSession(userId, preferences);
        sessionRef.current = next;
        publish(next);
        return;
      }
      if (!user || current.pending || current.running || current.failed) return;
      const preferences = preferencesForUser(user);
      if (!equalPreferences(current.preferences, preferences)) {
        current.preferences = preferences;
        publish(current);
      }
    },
    [publish],
  );

  const updatePreferences = useCallback(
    (update: Partial<AppearancePreferences>) => {
      const session = sessionRef.current;
      if (!session.userId) return;
      const preferences = {
        ...session.preferences,
        ...validatedPreferences(update),
      };
      if (equalPreferences(preferences, session.preferences)) return;
      session.preferences = preferences;
      session.pending = true;
      publish(session);
      void save(session);
    },
    [publish, save],
  );

  const retrySave = useCallback(() => {
    const session = sessionRef.current;
    if (!session.userId || !session.failed) return;
    session.failed = false;
    void save(session);
  }, [save]);

  const { preferences } = state;
  const resolvedTheme = "light" as const;
  const reducedMotion =
    preferences.motion === "reduce" ||
    (preferences.motion === "system" && systemPrefersReduced);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    const variant = preferences.theme.split("-")[1];
    if (variant) root.setAttribute("data-theme", variant);
    else root.removeAttribute("data-theme");
    root.classList.toggle("high-contrast", preferences.high_contrast);
    root.style.setProperty(
      "--font-size-scale",
      String(FONT_SIZE_SCALE[preferences.font_size]),
    );
    root.setAttribute("data-motion", preferences.motion);
    root.setAttribute("data-reduced-motion", String(reducedMotion));
    root.classList.toggle("reduce-motion", reducedMotion);
  }, [preferences, resolvedTheme, reducedMotion]);

  const value = useMemo(
    () => ({
      ...state,
      resolvedTheme,
      reducedMotion,
      systemPrefersReduced,
      updatePreferences,
      retrySave,
    }),
    [
      state,
      resolvedTheme,
      reducedMotion,
      systemPrefersReduced,
      updatePreferences,
      retrySave,
    ],
  );

  return (
    <AppearanceContext.Provider value={value}>
      <AppearanceSyncContext.Provider value={syncUser}>
        <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
          {children}
        </MotionConfig>
      </AppearanceSyncContext.Provider>
    </AppearanceContext.Provider>
  );
}

/** The authentication owner supplies identity; appearance has no auth dependency. */
export function AppearanceUserSync({
  user,
}: {
  user: AppearanceUser | undefined;
}) {
  const syncUser = useContext(AppearanceSyncContext);
  if (!syncUser)
    throw new Error("AppearanceUserSync requires AppearanceProvider");
  useLayoutEffect(() => {
    syncUser(user);
  }, [syncUser, user]);
  useLayoutEffect(() => () => syncUser(undefined), [syncUser]);
  return null;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance requires AppearanceProvider");
  return context;
}
