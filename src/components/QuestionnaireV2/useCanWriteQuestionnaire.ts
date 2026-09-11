import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";

import { QuestionnaireScope } from "@/types/questionnaire/questionnaire";

/**
 * Whether the current user may mutate questionnaires in `scope` — the single
 * gate for every questionnaire-v2 mutation surface (create, save, reorder,
 * clone, import, organizations).
 *
 * Facility mounts gate on the facility's *object* permissions, matching the
 * sibling facility-settings pages (e.g. TokenCategoryList); other mounts fall
 * back to the user's own permission union, since no object-scoped permissions
 * apply to an instance-wide list.
 *
 * `isLoading` is true while the facility (and its permissions) is still being
 * fetched on a facility mount — callers that replace a whole page based on
 * `canWrite` should wait for it instead of flashing a denied state.
 */
export function useCanWriteQuestionnaire(scope: QuestionnaireScope): {
  canWrite: boolean;
  isLoading: boolean;
} {
  const { hasPermission, userPermissions } = usePermissions();
  const { facility, isFacilityLoading } = useCurrentFacilitySilently();

  const { canWriteQuestionnaire } = getPermissions(
    hasPermission,
    scope.authContext === "facility"
      ? (facility?.permissions ?? [])
      : userPermissions,
  );

  return {
    canWrite: canWriteQuestionnaire,
    // Track the fetch, not data presence — a user who cannot read the
    // facility (404) would otherwise leave `!facility` true forever and pin
    // every facility questionnaire page on its loading skeleton.
    isLoading: scope.authContext === "facility" && isFacilityLoading,
  };
}
