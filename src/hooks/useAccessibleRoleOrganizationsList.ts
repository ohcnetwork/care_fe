import { useQuery } from "@tanstack/react-query";

import query from "@/Utils/request/query";
import organizationApi, {
  type AccessibleRoleOrganization,
} from "@/types/organization/organizationApi";

/**
 * Unfiltered accessible role organizations (same payload as sidebar / dashboard).
 * Central query key so all consumers share one cache.
 */
export function useAccessibleRoleOrganizationsList() {
  return useQuery({
    queryKey: ["accessibleRoleOrganizations", "list"],
    queryFn: query(organizationApi.accessibleRoleOrganizations, {
      queryParams: {},
    }),
  });
}

/**
 * Backend lists these orgs in accessible_role_organizations even when `role` is
 * null; organization GET may omit can_list_organization_users. Treat null role
 * as sufficient to show the Users area for that responsibility.
 */
export function hasResponsibilityUsersAccessViaNullRoleAssignment(
  organizationId: string,
  results: AccessibleRoleOrganization[] | undefined,
): boolean {
  const entry = results?.find(
    (item) => item.organization.id === organizationId,
  );
  return entry != null && entry.role == null;
}
