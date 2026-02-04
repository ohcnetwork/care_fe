import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { FilterState } from "@/hooks/useFilters";
import { Organization } from "@/types/organization/organization";

import organizationApi from "@/types/organization/organizationApi";
import query from "@/Utils/request/query";

interface UseOrganizationLevelProps {
  index: number;
  skip: boolean;
  selectedLevels: Organization[];
  setOrgTypes: React.Dispatch<React.SetStateAction<string[]>>;
  onChange: (filter: FilterState, index?: number) => void;
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
      const childrenType = currentOrg?.metadata?.govt_org_children_type;
      if (typeof childrenType === "string" && childrenType) {
        setOrgTypes((prevTypes) => {
          const newTypes = [...prevTypes];
          if (index === newTypes.length) {
            newTypes.push(childrenType);
          } else {
            newTypes[index + 1] = childrenType;
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

  /**
   * ✅ FIXED HANDLER
   * - Handles normal selection
   * - Handles clear (X button)
   * - Cascades child clears
   */
  const handleChange = (value: string) => {
    // 🔹 CLEAR CLICKED
    if (!value) {
      onChange(
        {
          organization: selectedLevels[index - 1]?.id,
        },
        index,
      );
      setLevelSearch("");
      return;
    }

    // 🔹 NORMAL SELECTION
    const selectedOrg = availableOrgs?.results.find((org) => org.id === value);

    if (!selectedOrg) return;

    onChange({ organization: selectedOrg.id }, index);
    setLevelSearch("");
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
export default useOrganizationLevel;
