import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import InputWithError from "@/components/ui/input-with-error";

import useDebouncedState from "@/hooks/useDebouncedState";

import { ORGANIZATION_LEVELS } from "@/common/constants";

import query from "@/Utils/request/query";
import { Organization, getOrgLevel } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface OrganizationSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  authToken?: string;
}

interface AutoCompleteOption {
  label: string;
  value: string;
}

export default function OrganizationSelector(props: OrganizationSelectorProps) {
  const { onChange, required } = props;
  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useDebouncedState("", 500);

  const headers = props.authToken
    ? {
        headers: {
          Authorization: `Bearer ${props.authToken}`,
        },
      }
    : {};

  const { data: getAllOrganizations } = useQuery({
    queryKey: ["organizations-root", searchQuery],
    queryFn: query(organizationApi.list, {
      queryParams: {
        org_type: "govt",
        parent: "",
        name: searchQuery || undefined,
      },
      ...headers,
    }),
  });

  const { data: currentLevelOrganizations } = useQuery<{
    results: Organization[];
  }>({
    queryKey: [
      "organizations-current",
      selectedLevels[selectedLevels.length - 1]?.id,
      searchQuery,
    ],
    queryFn: query(organizationApi.list, {
      queryParams: {
        parent: selectedLevels[selectedLevels.length - 1]?.id,
        org_type: "govt",
        name: searchQuery || undefined,
      },
      ...headers,
    }),
    enabled: selectedLevels.length > 0,
  });

  const handleLevelChange = (value: string, level: number) => {
    const orgList =
      level === 0
        ? getAllOrganizations?.results
        : currentLevelOrganizations?.results;

    const selectedOrg = orgList?.find((org: Organization) => org.id === value);
    if (!selectedOrg) return;

    const newLevels = selectedLevels.slice(0, level);
    newLevels.push(selectedOrg);
    setSelectedLevels(newLevels);

    if (!selectedOrg.has_children) {
      onChange(selectedOrg.id);
    }
  };

  const getOrganizationOptions = (
    orgs?: Organization[],
  ): AutoCompleteOption[] => {
    if (!orgs) return [];
    return orgs.map((org) => ({
      label: org.name,
      value: org.id,
    }));
  };

  const getLevelLabel = (org: Organization) => {
    const orgLevel = getOrgLevel(org.org_type, org.level_cache);
    return typeof orgLevel === "string" ? orgLevel : orgLevel[0];
  };

  const handleEdit = (level: number) => {
    setSelectedLevels((prev) => prev.slice(0, level));
  };

  return (
    <>
      {/* Selected Levels */}
      {selectedLevels.map((level, index) => (
        <div>
          <InputWithError
            key={level.id}
            label={
              index === 0 ? ORGANIZATION_LEVELS.govt[0] : getLevelLabel(level)
            }
            required={required}
          >
            <div className="flex">
              <div className="flex items-center h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-950 placeholder:text-gray-500 focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-gray-800 dark:file:text-gray-50 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300">
                {level.name}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(index)}
                type="button"
              >
                <CareIcon icon="l-trash" className="h-4 w-4" />
              </Button>
            </div>
          </InputWithError>
        </div>
      ))}

      {/* Next Level Selection */}
      {(!selectedLevels.length ||
        selectedLevels[selectedLevels.length - 1]?.has_children) && (
        <div>
          <InputWithError
            label={ORGANIZATION_LEVELS.govt[selectedLevels.length]}
            required={selectedLevels.length === 0 && required}
          >
            <Autocomplete
              value=""
              options={getOrganizationOptions(
                selectedLevels.length === 0
                  ? getAllOrganizations?.results
                  : currentLevelOrganizations?.results,
              )}
              onChange={(value: string) =>
                handleLevelChange(value, selectedLevels.length)
              }
              onSearch={setSearchQuery}
            />
          </InputWithError>
        </div>
      )}
    </>
  );
}
