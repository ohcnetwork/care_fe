import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { FilterState } from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface UseGovtOrganizationLevelProps {
  index: number;
  _selectedLevels: Organization[];
  onChange: (filter: FilterState, index: number) => void;
  getParentId: (index: number) => string;
  authToken?: string;
}

interface AutoCompleteOption {
  label: string;
  value: string;
}

export function useGovtOrganizationLevel({
  index,
  _selectedLevels,
  onChange,
  getParentId,
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

  const { data: organizations } = useQuery({
    queryKey: ["organizations-level", getParentId(index), searchQuery],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        org_type: "govt",
        parent: getParentId(index),
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
  };
}
