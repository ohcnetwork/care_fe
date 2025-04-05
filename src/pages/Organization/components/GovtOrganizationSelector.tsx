import { t } from "i18next";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import Autocomplete from "@/components/ui/autocomplete";
import { Label } from "@/components/ui/label";

import { FilterState } from "@/hooks/useFilters";
import { useGovtOrganizationLevel } from "@/hooks/useGovtOrganizationLevel";

import { Organization } from "@/types/organization/organization";

interface GovtOrganizationSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  authToken?: string;
  selected?: Organization[];
}

interface OrganizationLevelProps {
  index: number;
  currentLevel?: Organization;
  previousLevel?: Organization;
  onChange: (
    filter: FilterState,
    index: number,
    organization: Organization,
  ) => void;
  required?: boolean;
  authToken?: string;
}

function OrganizationLevelSelect({
  index,
  currentLevel,
  previousLevel,
  onChange,
  required,
  authToken,
}: OrganizationLevelProps) {
  const parentId = index === 0 ? "" : previousLevel?.id || "";

  const { options, handleChange, handleSearch, organizations, isFetching } =
    useGovtOrganizationLevel({
      index,
      onChange: (filter: FilterState, index: number) => {
        const selectedOrg = organizations?.find(
          (org) => org.id === filter.organization,
        );
        if (selectedOrg) {
          onChange(filter, index, selectedOrg);
        }
      },
      parentId,
      authToken,
    });

  return (
    <div className="mt-2">
      <Label className="mb-2">
        {t(
          currentLevel
            ? `SYSTEM__govt_org_type__${currentLevel.metadata?.govt_org_type}`
            : index === 0
              ? "SYSTEM__govt_org_type__default"
              : `SYSTEM__govt_org_type__${previousLevel?.metadata?.govt_org_children_type || "default"}`,
        )}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-2">
        {isFetching && <Loader2 className="size-6 animate-spin" />}
        <Autocomplete
          value={currentLevel?.id || ""}
          options={options}
          onChange={handleChange}
          onSearch={handleSearch}
          data-cy={`select-${
            currentLevel?.metadata?.govt_org_type?.toLowerCase() ||
            previousLevel?.metadata?.govt_org_children_type?.toLowerCase() ||
            "state"
          }`}
        />
      </div>
    </div>
  );
}

export default function GovtOrganizationSelector(
  props: GovtOrganizationSelectorProps,
) {
  const { onChange, required, selected, authToken } = props;
  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);

  useEffect(() => {
    if (required && selectedLevels[selectedLevels.length - 1]?.has_children) {
      onChange("");
    }
  }, [selectedLevels]);

  useEffect(() => {
    if (selected && selected.length > 0) {
      let currentOrg = selected[0];
      if (currentOrg.level_cache === 0) {
        setSelectedLevels(selected);
      } else {
        const levels: Organization[] = [];
        while (currentOrg && currentOrg.level_cache >= 0) {
          levels.unshift(currentOrg);
          currentOrg = currentOrg.parent as unknown as Organization;
        }
        setSelectedLevels(levels);
      }
    }
  }, [selected]);

  const handleFilterChange = (
    filter: FilterState,
    index: number,
    organization: Organization,
  ) => {
    if (filter.organization) {
      setSelectedLevels((prev) => {
        const newLevels = prev.slice(0, index);
        newLevels.push(organization);
        return newLevels;
      });
      if (!required || (required && !organization.has_children)) {
        onChange(organization.id);
      } else {
        onChange("");
      }
    } else {
      onChange("");
      // Reset subsequent levels when clearing a selection
      setSelectedLevels((prev) => prev.slice(0, index));
    }
  };

  // Calculate the number of levels to show based on selectedLevels and has_children
  const totalLevels =
    selectedLevels.length +
    (selectedLevels.length === 0 ||
    selectedLevels[selectedLevels.length - 1]?.has_children
      ? 1
      : 0);

  return (
    <>
      {Array.from({ length: totalLevels }).map((_, index) => (
        <OrganizationLevelSelect
          key={index}
          index={index}
          currentLevel={selectedLevels[index]}
          previousLevel={selectedLevels[index - 1]}
          onChange={handleFilterChange}
          required={required}
          authToken={authToken}
        />
      ))}
    </>
  );
}
