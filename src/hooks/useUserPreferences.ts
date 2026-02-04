import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useReducer } from "react";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import userApi from "@/types/user/userApi";
import { QuickLinkCustom, UserPreference } from "@/types/user/userPreferences";

// Action types for preferences reducer
type PreferencesAction =
  // Custom links actions
  | { type: "ADD_CUSTOM_LINK"; payload: QuickLinkCustom }
  | { type: "REMOVE_CUSTOM_LINK"; payload: string }
  | { type: "UPDATE_CUSTOM_LINK"; payload: QuickLinkCustom }
  // Blacklist actions (for hiding default shortcuts)
  | { type: "BLACKLIST_SHORTCUT"; payload: string }
  | { type: "UNBLACKLIST_SHORTCUT"; payload: string }
  | { type: "SET_BLACKLIST"; payload: string[] }
  // Generic setter for future preference types
  | { type: "SET_PREFERENCE"; key: keyof UserPreference; payload: unknown }
  | { type: "RESET_CUSTOM_LINKS"; payload: UserPreference };

export const MAX_QUICK_LINKS = 10;

function preferencesReducer(
  state: UserPreference,
  action: PreferencesAction,
): UserPreference {
  switch (action.type) {
    case "ADD_CUSTOM_LINK":
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          custom_links: [
            ...(state.facility_quick_links?.custom_links ?? []),
            action.payload,
          ],
        },
      };

    case "REMOVE_CUSTOM_LINK":
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          custom_links: state.facility_quick_links?.custom_links?.filter(
            (link) => link.link !== action.payload,
          ),
        },
      };

    case "UPDATE_CUSTOM_LINK":
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          custom_links: state.facility_quick_links?.custom_links?.map((link) =>
            link.link === action.payload.link ? action.payload : link,
          ),
        },
      };

    case "BLACKLIST_SHORTCUT":
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          blacklist: [
            ...(state.facility_quick_links?.blacklist ?? []),
            action.payload,
          ],
        },
      };

    case "UNBLACKLIST_SHORTCUT":
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          blacklist: state.facility_quick_links?.blacklist?.filter(
            (id) => id !== action.payload,
          ),
        },
      };

    case "SET_BLACKLIST":
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          blacklist: action.payload,
        },
      };

    case "SET_PREFERENCE":
      return {
        ...state,
        [action.key]: action.payload,
      } as UserPreference;

    case "RESET_CUSTOM_LINKS":
      return action.payload;

    default:
      return state;
  }
}

export function useUserPreferences() {
  const user = useAuthUser();
  const queryClient = useQueryClient();

  // Reducer for local state changes
  const [preferences, dispatch] = useReducer(
    preferencesReducer,
    user.preferences ?? {},
  );

  const customLinksCount =
    preferences.facility_quick_links?.custom_links?.length ?? 0;
  const blacklist = preferences.facility_quick_links?.blacklist ?? [];
  const customLinks = preferences.facility_quick_links?.custom_links ?? [];

  // Mutation to sync with backend
  const { mutate: syncPreferences, isPending } = useMutation({
    mutationFn: mutate(userApi.setPreferences, {
      pathParams: { username: user.username },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  // Sync reducer state when server state changes (after query invalidation)
  useEffect(() => {
    dispatch({ type: "RESET_CUSTOM_LINKS", payload: user?.preferences ?? {} });
  }, [user?.preferences]);

  // Map action types to the preference key they affect
  const getAffectedPreferenceKey = (
    action: PreferencesAction,
  ): keyof UserPreference | null => {
    switch (action.type) {
      case "ADD_CUSTOM_LINK":
      case "REMOVE_CUSTOM_LINK":
      case "UPDATE_CUSTOM_LINK":
      case "BLACKLIST_SHORTCUT":
      case "UNBLACKLIST_SHORTCUT":
      case "SET_BLACKLIST":
      case "RESET_CUSTOM_LINKS":
        return "facility_quick_links";
      case "SET_PREFERENCE":
        return action.key;
      default:
        return null;
    }
  };

  // Wrapped dispatch that also syncs to backend
  const updatePreferences = useCallback(
    (action: PreferencesAction) => {
      dispatch(action);
      const newState = preferencesReducer(preferences, action);
      const key = getAffectedPreferenceKey(action);

      if (key) {
        syncPreferences({
          version: "0.0.1",
          preference: key,
          value: newState[key] ?? {},
        });
      }
    },
    [preferences, syncPreferences],
  );

  // Custom links methods
  const addCustomLink = useCallback(
    (link: QuickLinkCustom) => {
      const currentCount =
        preferences.facility_quick_links?.custom_links?.length ?? 0;
      if (currentCount >= MAX_QUICK_LINKS) {
        return false;
      }
      updatePreferences({ type: "ADD_CUSTOM_LINK", payload: link });
      return true;
    },
    [preferences.facility_quick_links?.custom_links?.length, updatePreferences],
  );

  const removeCustomLink = useCallback(
    (linkHref: string) => {
      updatePreferences({ type: "REMOVE_CUSTOM_LINK", payload: linkHref });
    },
    [updatePreferences],
  );

  const updateCustomLink = useCallback(
    (link: QuickLinkCustom) => {
      updatePreferences({ type: "UPDATE_CUSTOM_LINK", payload: link });
    },
    [updatePreferences],
  );

  // Blacklist methods (for hiding default shortcuts)
  const blacklistShortcut = useCallback(
    (shortcutId: string) => {
      updatePreferences({ type: "BLACKLIST_SHORTCUT", payload: shortcutId });
    },
    [updatePreferences],
  );

  const unblacklistShortcut = useCallback(
    (shortcutId: string) => {
      updatePreferences({ type: "UNBLACKLIST_SHORTCUT", payload: shortcutId });
    },
    [updatePreferences],
  );

  const setBlacklist = useCallback(
    (shortcutIds: string[]) => {
      updatePreferences({ type: "SET_BLACKLIST", payload: shortcutIds });
    },
    [updatePreferences],
  );

  const resetPreferences = useCallback(() => {
    updatePreferences({ type: "RESET_CUSTOM_LINKS", payload: {} });
  }, [updatePreferences]);

  const canAddMoreLinks = useMemo(() => {
    const currentCount =
      preferences.facility_quick_links?.custom_links?.length ?? 0;
    return currentCount < MAX_QUICK_LINKS;
  }, [preferences.facility_quick_links?.custom_links?.length]);

  const isBlacklisted = useCallback(
    (shortcutId: string) => {
      return (
        preferences.facility_quick_links?.blacklist?.includes(shortcutId) ??
        false
      );
    },
    [preferences.facility_quick_links?.blacklist],
  );

  // Helper to check if a link is a custom link
  const isCustomLink = useCallback(
    (linkHref: string) => {
      return (
        preferences.facility_quick_links?.custom_links?.some(
          (link) => link.link === linkHref,
        ) ?? false
      );
    },
    [preferences.facility_quick_links?.custom_links],
  );

  return {
    preferences,
    isPending,
    // Raw dispatch for advanced usage
    dispatch: updatePreferences,
    // Custom links methods
    addCustomLink,
    removeCustomLink,
    updateCustomLink,
    isCustomLink,
    customLinks,
    customLinksCount,
    canAddMoreLinks,
    maxCustomLinks: MAX_QUICK_LINKS,
    // Blacklist methods
    blacklistShortcut,
    unblacklistShortcut,
    setBlacklist,
    isBlacklisted,
    blacklist,
    resetPreferences,
  };
}

export default useUserPreferences;
