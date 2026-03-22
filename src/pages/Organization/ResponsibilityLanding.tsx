import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect } from "react";

import query from "@/Utils/request/query";
import organizationApi from "@/types/organization/organizationApi";

import OrganizationUsers from "./OrganizationUsers";

interface Props {
  id: string;
}

/**
 * Landing page for /responsibilities/:id
 * Checks if the user can list organization users. If not, redirects to patients.
 */
export default function ResponsibilityLanding({ id }: Props) {
  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: query(organizationApi.get, {
      pathParams: { id },
    }),
    enabled: !!id,
  });

  const canListUsers =
    org?.permissions?.includes("can_list_organization_users") ?? false;

  useEffect(() => {
    if (!isLoading && org && !canListUsers) {
      navigate(`/responsibilities/${id}/patients`, { replace: true });
    }
  }, [isLoading, org, canListUsers, id]);

  // While loading or if user can list users, show users page
  if (isLoading || canListUsers) {
    return <OrganizationUsers id={id} routeContext="responsibility" />;
  }

  // Fallback — redirect should have fired, but render users as safe default
  return <OrganizationUsers id={id} routeContext="responsibility" />;
}
