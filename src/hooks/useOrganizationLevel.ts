import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { FilterState } from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface UseOrganizationLevelProps {
  index: number;
  skip: boolean;
  selectedLevels: Organization[];
  setOrgTypes: React.Dispatch<React.SetStateAction<string[]>>;
  onChange: (Filter: FilterState, index?: number) => void;
}

export function useOrganizationLevel({
  index,
  skip,
  selectedLevels,
  setOrgTypes,
  onChange,
}: UseOrganizationLevelProps) {
  const [levelSearch, setLevelSearch] = useState("");

  const getParentId = (index: number) => {
    if (index === 0) return "0";
    return selectedLevels[index - 1]?.id;
  };

  const { data: availableOrgs } = useQuery({
    queryKey: ["organizations-available", getParentId(index), levelSearch],
    queryFn: query.debounced(organizationApi.getPublicOrganizations, {
      queryParams: {
        ...(index > 0 && { parent: getParentId(index) }),
        ...(index === 0 && { level_cache: 1 }),
        name: levelSearch || undefined,
        limit: 200,
      },
    }),
    enabled:
      !skip &&
      index <= selectedLevels.length &&
      (index === 0 || selectedLevels[index - 1] !== undefined),
  });

  // Update org types when we get new data for this level
  useEffect(() => {
    if (selectedLevels[index]) {
      const currentOrg = selectedLevels[index];
      if (currentOrg?.metadata?.govt_org_children_type) {
        setOrgTypes((prevTypes) => {
          const newTypes = [...prevTypes];
          // Update next level type
          if (currentOrg.metadata?.govt_org_children_type) {
            if (index === newTypes.length) {
              newTypes.push(currentOrg.metadata.govt_org_children_type);
            } else {
              newTypes[index + 1] = currentOrg.metadata.govt_org_children_type;
            }
          }
          return newTypes;
        });
      }
    }
  }, [selectedLevels, setOrgTypes, index]);

  const options = useMemo(() => {
    return (
      availableOrgs?.results?.map((org) => ({
        label: org.name,
        value: org.id,
      })) || []
    );
  }, [availableOrgs?.results]);

  const handleChange = (value: string) => {
    const selectedOrg = availableOrgs?.results.find((org) => org.id === value);
    if (selectedOrg) {
      onChange({ organization: selectedOrg.id }, index);
      setLevelSearch("");
    }
  };

  const handleSearch = (value: string) => setLevelSearch(value);

  return {
    options,
    levelSearch,
    handleChange,
    handleSearch,
    availableOrgs,
  };
}
