import {
  PERMISSION_READ_IMMUNIZATION_POLICY,
  PERMISSION_WRITE_IMMUNIZATION_POLICY,
} from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { ImmunizationPolicyScope } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export function useImmunizationPolicyAccess(scope: ImmunizationPolicyScope) {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { facility, facilityId, isFacilityLoading } =
    useCurrentFacilitySilently();
  const permissions =
    facilityId === scope.facilityId ? (facility?.permissions ?? []) : [];
  const rootPermissions =
    facilityId === scope.facilityId
      ? (facility?.root_org_permissions ?? [])
      : [];

  return {
    // The backend allows authenticated users to read instance policies.
    canRead:
      !scope.facilityId ||
      hasPermission(PERMISSION_READ_IMMUNIZATION_POLICY, permissions),
    canWrite: scope.facilityId
      ? hasPermission(PERMISSION_WRITE_IMMUNIZATION_POLICY, rootPermissions)
      : isSuperAdmin,
    isLoading: !!scope.facilityId && isFacilityLoading,
  };
}
