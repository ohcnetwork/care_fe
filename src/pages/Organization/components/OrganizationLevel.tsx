import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import Autocomplete from "@/components/ui/autocomplete";

import { FilterState } from "@/hooks/useFilters";
import { useOrganizationLevel } from "@/hooks/useOrganizationLevel";

import { Organization } from "@/types/organization/organization";

interface OrganizationLevelProps {
  index: number;
  skip: boolean;
  selectedLevels: Organization[];
  orgTypes: string[];
  setOrgTypes: React.Dispatch<React.SetStateAction<string[]>>;
  onChange: (Filter: FilterState, index?: number) => void;
}

export function OrganizationLevel({
  index,
  skip,
  selectedLevels,
  orgTypes,
  setOrgTypes,
  onChange,
}: OrganizationLevelProps) {
  const { t } = useTranslation();
  const { options, handleChange, handleSearch } = useOrganizationLevel({
    index,
    skip,
    selectedLevels,
    setOrgTypes,
    onChange,
  });

  if (skip) return null;
  const orgType = orgTypes[index];

  return (
    <Autocomplete
      popoverClassName={cn(
        "lg:border-0 lg:border-0 lg:shadow-none lg:rounded-none min-w-56 lg:max-w-72",
        index !== 0 && "lg:border-l lg:border-secondary-400",
      )}
      key={`dropdown-${index}`}
      value={selectedLevels[index]?.id || ""}
      options={options}
      onChange={handleChange}
      onSearch={handleSearch}
      placeholder={
        orgType
          ? t("select") +
            " " +
            t(`SYSTEM__govt_org_type__${orgType?.toLowerCase()}`)
          : t("select_location")
      }
      disabled={index > selectedLevels.length}
      align="start"
      showClearButton={false}
    />
  );
}
