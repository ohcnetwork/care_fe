import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect } from "react";

import { usePermissions } from "@/context/PermissionContext";
import {
  hasResponsibilityUsersAccessViaNullRoleAssignment,
  useAccessibleRoleOrganizationsList,
} from "@/hooks/useAccessibleRoleOrganizationsList";
import organizationApi from "@/types/organization/organizationApi";
import query from "@/Utils/request/query";

import OrganizationUsers from "./OrganizationUsers";

interface Props {
  id: string;
}

/**
 * Landing page for /responsibilities/:id
 * Checks if the user can list organization users. If not, redirects to patients.
 * Entries from accessible_role_organizations with role null still get Users
 * even when organization.permissions omits can_list_organization_users.
 */
export default function ResponsibilityLanding({ id }: Props) {
  const { hasPermission } = usePermissions();
  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: query(organizationApi.get, {
      pathParams: { id },
    }),
    enabled: !!id,
  });

  const { data: accessibleData, isLoading: isLoadingAccessible } =
    useAccessibleRoleOrganizationsList();

  const canListUsersViaNullRole =
    hasResponsibilityUsersAccessViaNullRoleAssignment(
      id,
      accessibleData?.results,
    );
  const canListUsers =
    hasPermission("can_list_organization_users", org?.permissions) ||
    canListUsersViaNullRole;

  useEffect(() => {
    if (!isLoading && !isLoadingAccessible && org && !canListUsers) {
      navigate(`/responsibilities/${id}/patients`, { replace: true });
    }
  }, [isLoading, isLoadingAccessible, org, canListUsers, id]);

  // Wait for accessible list so null-role access is not redirected away early
  if (isLoading || isLoadingAccessible || canListUsers) {
    return <OrganizationUsers id={id} routeContext="responsibility" />;
  }

  // Fallback — redirect should have fired, but render users as safe default
  return <OrganizationUsers id={id} routeContext="responsibility" />;
}
