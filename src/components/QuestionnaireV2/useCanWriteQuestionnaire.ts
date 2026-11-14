import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";

import { QuestionnaireScope } from "@/types/questionnaire/questionnaire";

/**
 * Whether the current user may mutate questionnaires in `scope`, mirroring the
 * backend rules: instance → superuser; facility → write role on the facility's
 * root organization; user and facility_organization → write role in the
 * facility (the org's parent chain reaches the root, so root permissions are
 * a conservative stand-in until the org itself is loaded).
 *
 * `isLoading` tracks the facility fetch, not data presence, so a user who
 * cannot read the facility does not stay on the loading skeleton forever.
 */
export function useCanWriteQuestionnaire(scope: QuestionnaireScope): {
  canWrite: boolean;
  isLoading: boolean;
} {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { facility, isFacilityLoading } = useCurrentFacilitySilently();

  if (scope.authContext === "instance") {
    return { canWrite: isSuperAdmin, isLoading: false };
  }

  const { canWriteQuestionnaire } = getPermissions(
    hasPermission,
    scope.authContext === "user"
      ? (facility?.permissions ?? [])
      : (facility?.root_org_permissions ?? []),
  );

  return { canWrite: canWriteQuestionnaire, isLoading: isFacilityLoading };
}
