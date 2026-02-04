import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useReducer } from "react";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import userApi from "@/types/user/userApi";
import {
  QuickLinkCustom,
  UserPreference,
  UserPreferenceKey,
} from "@/types/user/userPreferences";

enum ActionType {
  ADD_CUSTOM_LINK = "ADD_CUSTOM_LINK",
  REMOVE_CUSTOM_LINK = "REMOVE_CUSTOM_LINK",
  UPDATE_CUSTOM_LINK = "UPDATE_CUSTOM_LINK",
  BLACKLIST_SHORTCUT = "BLACKLIST_SHORTCUT",
  UNBLACKLIST_SHORTCUT = "UNBLACKLIST_SHORTCUT",
  SET_BLACKLIST = "SET_BLACKLIST",
  SET_PREFERENCE = "SET_PREFERENCE",
  RESET_CUSTOM_LINKS = "RESET_CUSTOM_LINKS",
}

// Action types for preferences reducer
type PreferencesAction =
  | { type: ActionType.ADD_CUSTOM_LINK; payload: QuickLinkCustom }
  | { type: ActionType.REMOVE_CUSTOM_LINK; payload: string }
  | { type: ActionType.UPDATE_CUSTOM_LINK; payload: QuickLinkCustom }
  | { type: ActionType.BLACKLIST_SHORTCUT; payload: string }
  | { type: ActionType.UNBLACKLIST_SHORTCUT; payload: string }
  | { type: ActionType.SET_BLACKLIST; payload: string[] }
  | {
      type: ActionType.SET_PREFERENCE;
      key: UserPreferenceKey;
      payload: unknown;
    }
  | { type: ActionType.RESET_CUSTOM_LINKS; payload: UserPreference };

export const MAX_QUICK_LINKS = 10;

function preferencesReducer(
  state: UserPreference,
  action: PreferencesAction,
): UserPreference {
  switch (action.type) {
    case ActionType.ADD_CUSTOM_LINK:
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

    case ActionType.REMOVE_CUSTOM_LINK:
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          custom_links: state.facility_quick_links?.custom_links?.filter(
            (link) => link.link !== action.payload,
          ),
        },
      };

    case ActionType.UPDATE_CUSTOM_LINK:
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          custom_links: state.facility_quick_links?.custom_links?.map((link) =>
            link.link === action.payload.link ? action.payload : link,
          ),
        },
      };

    case ActionType.BLACKLIST_SHORTCUT:
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

    case ActionType.UNBLACKLIST_SHORTCUT:
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          blacklist: state.facility_quick_links?.blacklist?.filter(
            (id) => id !== action.payload,
          ),
        },
      };

    case ActionType.SET_BLACKLIST:
      return {
        ...state,
        facility_quick_links: {
          ...state.facility_quick_links,
          blacklist: action.payload,
        },
      };

    case ActionType.SET_PREFERENCE:
      return {
        ...state,
        [action.key]: action.payload,
      } as UserPreference;

    case ActionType.RESET_CUSTOM_LINKS:
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
    dispatch({
      type: ActionType.RESET_CUSTOM_LINKS,
      payload: user?.preferences ?? {},
    });
  }, [user?.preferences]);

  const getAffectedPreferenceKey = (
    action: PreferencesAction,
  ): UserPreferenceKey => {
    if (action.type === ActionType.SET_PREFERENCE) {
      return action.key;
    }
    return "facility_quick_links";
  };

  // Wrapped dispatch that also syncs to backend
  const updatePreferences = useCallback(
    (action: PreferencesAction) => {
      dispatch(action);
      const newState = preferencesReducer(preferences, action);
      const key = getAffectedPreferenceKey(action);

      syncPreferences({
        version: "0.0.1",
        preference: key,
        value: newState[key] ?? {},
      });
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
      updatePreferences({ type: ActionType.ADD_CUSTOM_LINK, payload: link });
      return true;
    },
    [preferences.facility_quick_links?.custom_links?.length, updatePreferences],
  );

  const removeCustomLink = useCallback(
    (linkHref: string) => {
      updatePreferences({
        type: ActionType.REMOVE_CUSTOM_LINK,
        payload: linkHref,
      });
    },
    [updatePreferences],
  );

  const updateCustomLink = useCallback(
    (link: QuickLinkCustom) => {
      updatePreferences({ type: ActionType.UPDATE_CUSTOM_LINK, payload: link });
    },
    [updatePreferences],
  );

  // Blacklist methods (for hiding default shortcuts)
  const blacklistShortcut = useCallback(
    (shortcutId: string) => {
      updatePreferences({
        type: ActionType.BLACKLIST_SHORTCUT,
        payload: shortcutId,
      });
    },
    [updatePreferences],
  );

  const unblacklistShortcut = useCallback(
    (shortcutId: string) => {
      updatePreferences({
        type: ActionType.UNBLACKLIST_SHORTCUT,
        payload: shortcutId,
      });
    },
    [updatePreferences],
  );

  const setBlacklist = useCallback(
    (shortcutIds: string[]) => {
      updatePreferences({
        type: ActionType.SET_BLACKLIST,
        payload: shortcutIds,
      });
    },
    [updatePreferences],
  );

  const resetPreferences = useCallback(() => {
    updatePreferences({ type: ActionType.RESET_CUSTOM_LINKS, payload: {} });
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
