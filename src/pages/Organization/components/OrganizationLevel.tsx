import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

import { FilterState } from "@/hooks/useFilters";
import { useOrganizationLevel } from "@/hooks/useOrganizationLevel";

import { classNames } from "@/Utils/utils";
import { Organization } from "@/types/organization/organization";

interface OrganizationLevelProps {
  index: number;
  skip: boolean;
  selectedLevels: Organization[];
  orgTypes: string[];
  setOrgTypes: React.Dispatch<React.SetStateAction<string[]>>;
  onChange: (Filter: FilterState, index?: number) => void;
  getParentId: (index: number) => string;
}

export function OrganizationLevel({
  index,
  skip,
  selectedLevels,
  orgTypes,
  setOrgTypes,
  onChange,
  getParentId,
}: OrganizationLevelProps) {
  const { t } = useTranslation();
  const { options, handleChange, handleSearch } = useOrganizationLevel({
    index,
    skip,
    selectedLevels,
    setOrgTypes,
    onChange,
    getParentId,
  });

  if (skip) return null;
  const orgType = orgTypes[index];

  return (
    <Autocomplete
      popoverClassName={classNames(
        "lg:border-0 lg:border-0 lg:shadow-none lg:rounded-none lg:max-w-72",
        index !== 0 && "lg:border-l lg:border-secondary-500",
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
          : t("select_previous")
      }
      disabled={index > selectedLevels.length}
      align="start"
    />
  );
}
