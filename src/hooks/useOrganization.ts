import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect } from "react";
import { toast } from "sonner";

import query from "@/Utils/request/query";
import organizationApi from "@/types/organization/organizationApi";

interface UseOrganizationParams {
  orgType?: string;
  parentId?: string;
  name?: string;
  enabled?: boolean;
}

export function useOrganization({
  orgType = "",
  parentId = "",
  name = "",
  enabled = true,
}: UseOrganizationParams) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["organization", orgType, name, parentId],
    queryFn: query(organizationApi.list, {
      queryParams: {
        org_type: orgType,
        parent: parentId,
        name,
      },
    }),
    enabled: enabled && !!name,
  });

  useEffect(() => {
    if (isError) {
      toast.error(t("organizations_fetch_error"));
    }
  }, [isError]);

  return {
    organizations: data?.results || [],
    isLoading,
    isError,
  };
}
