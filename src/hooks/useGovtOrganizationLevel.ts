import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { FilterState } from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface UseGovtOrganizationLevelProps {
  index: number;
  onChange: (filter: FilterState, index: number) => void;
  parentId: string;
  authToken?: string;
}

interface AutoCompleteOption {
  label: string;
  value: string;
}

export function useGovtOrganizationLevel({
  index,
  onChange,
  parentId,
  authToken,
}: UseGovtOrganizationLevelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const headers = authToken
    ? {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    : {};

  const { data: organizations, isLoading } = useQuery({
    queryKey: ["organizations-level", parentId, searchQuery],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        org_type: "govt",
        parent: parentId,
        name: searchQuery || undefined,
        limit: 200,
      },
      ...headers,
    }),
  });

  const handleChange = (value: string) => {
    const selectedOrg = organizations?.results?.find(
      (org: Organization) => org.id === value,
    );

    if (selectedOrg) {
      onChange({ organization: selectedOrg.id }, index);
    }
    setSearchQuery("");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const options: AutoCompleteOption[] =
    organizations?.results?.map((org: Organization) => ({
      label: org.name,
      value: org.id,
    })) || [];

  return {
    options,
    handleChange,
    handleSearch,
    organizations: organizations?.results,
    isLoading,
  };
}
