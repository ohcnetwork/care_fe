import Autocomplete from "@/components/ui/autocomplete";
import { FilterState } from "@/hooks/useFilters";
import { useOrganizationLevel } from "@/hooks/useOrganizationLevel";
import { Organization } from "@/types/organization/organization";
import { useTranslation } from "react-i18next";

interface OrganizationLevelProps {
  index: number;
  skip: boolean;
  selectedLevels: Organization[];
  orgTypes: string[];
  setOrgTypes: React.Dispatch<React.SetStateAction<string[]>>;
  onChange: (filter: FilterState, index?: number) => void;
}

/**
 * Static mapping so i18n cleanup scripts can detect keys
 */
const ORG_TYPE_I18N_KEYS: Record<string, string> = {
  state: "SYSTEM__govt_org_type__state",
  district: "SYSTEM__govt_org_type__district",
  local_body: "SYSTEM__govt_org_type__local_body",
};

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
  const orgTypeKey = orgType
    ? ORG_TYPE_I18N_KEYS[orgType.toLowerCase()]
    : undefined;

  return (
    <Autocomplete
      key={`dropdown-${index}`}
      popoverClassName="min-w-56 lg:max-w-72"
      value={selectedLevels[index]?.id || ""}
      options={options}
      onChange={handleChange}
      onSearch={handleSearch}
      placeholder={
        orgType && orgTypeKey
          ? `${t("select")} ${t(orgTypeKey)}`
          : t("select_location")
      }
      disabled={index > selectedLevels.length}
      align="start"
      showClearButton={!!selectedLevels[index]}
    />
  );
}
