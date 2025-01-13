import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
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

// TODO: Rename to GovtOrganizationSelector
export default function OrganizationSelector(props: OrganizationSelectorProps) {
  const { onChange, required } = props;
  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const headers = props.authToken
    ? {
        headers: {
          Authorization: `Bearer ${props.authToken}`,
        },
      }
    : {};

  const { data: getAllOrganizations } = useQuery({
    queryKey: ["organizations-root", searchQuery],
    queryFn: query.debounced(organizationApi.list, {
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
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        parent: selectedLevels[selectedLevels.length - 1]?.id,
        org_type: "govt",
        limit: 200,
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

  const handleEdit = (level: number) => {
    setSelectedLevels((prev) => prev.slice(0, level));
  };

  const lastLevel = selectedLevels[selectedLevels.length - 1];

  return (
    <>
      {/* Selected Levels */}
      {selectedLevels.map((level, index) => (
        <div key={index}>
          <Label className="mb-2">
            {t(`SYSTEM__govt_org_type__${level.metadata?.govt_org_type}`)}
            {required && <span className="text-red-500">*</span>}
          </Label>
          <div className="flex">
            <div
              className="flex items-center h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-950 placeholder:text-gray-500 focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-gray-800 dark:file:text-gray-50 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
              data-cy={`select-${level.metadata?.govt_org_type?.toLowerCase()}`}
            >
              <div className="w-full text-nowrap overflow-x-auto">
                {level.name}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(index)}
              type="button"
              data-cy={`edit-${level.metadata?.govt_org_type?.toLowerCase()}`}
            >
              <CareIcon icon="l-trash" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Next Level Selection */}
      {(!selectedLevels.length ||
        selectedLevels[selectedLevels.length - 1]?.has_children) && (
        <div>
          <Label className="mb-2">
            {t(
              lastLevel
                ? `SYSTEM__govt_org_type__${lastLevel.metadata?.govt_org_children_type || "default"}`
                : "SYSTEM__govt_org_type__default",
            )}
          </Label>
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
            data-cy={`select-${
              lastLevel?.metadata?.govt_org_children_type?.toLowerCase() ||
              lastLevel?.metadata?.govt_org_type?.toLowerCase() ||
              "state"
            }`}
          />
        </div>
      )}
    </>
  );
}
