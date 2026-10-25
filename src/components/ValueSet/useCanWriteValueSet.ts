import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";

import { ValueSetScope } from "@/types/valueSet/valueSet";

/**
 * Whether the current user may create or edit value sets in `scope` — the
 * single gate for the list's Create button, the editor's save and the
 * departments field.
 *
 * Facility mounts gate on the facility's *object* permissions (the backend
 * checks `can_write_valueset` in the facility's root organization); the
 * instance-wide writes require a superuser.
 *
 * `isLoading` is true while the facility (and its permissions) is still
 * being fetched on a facility mount, so callers can hold a skeleton instead
 * of flashing a denied state.
 */
export function useCanWriteValueSet(scope: ValueSetScope): {
  canWrite: boolean;
  isLoading: boolean;
} {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { facility, isFacilityLoading } = useCurrentFacilitySilently();

  const { canWriteValueSet } = getPermissions(
    hasPermission,
    facility?.root_org_permissions ?? [],
  );

  return {
    canWrite:
      scope.authContext === "facility" ? canWriteValueSet : isSuperAdmin,
    // Track the fetch, not data presence — a user who cannot read the
    // facility (404) would otherwise leave `!facility` true forever.
    isLoading: scope.authContext === "facility" && isFacilityLoading,
  };
}
