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
  organizationId?: string;
  navOrganizationId?: string;
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
  isFetching?: boolean;
}

function OrganizationLevelSelect({
  index,
  currentLevel,
  previousLevel,
  onChange,
  required,
  authToken,
  isFetching,
}: OrganizationLevelProps) {
  const parentId = index === 0 ? "" : previousLevel?.id || "";

  const { options, handleChange, handleSearch, organizations } =
    useGovtOrganizationLevel({
      index,
      onChange: (filter, index) => {
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
              : `SYSTEM__govt_org_type__${
                  previousLevel?.metadata?.govt_org_children_type || "default"
                }`,
        )}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-2">
        {isFetching && <Loader2 className="h-6 w-6 animate-spin" />}
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
  const {
    onChange,
    required,
    selected,
    authToken,
    navOrganizationId,
    organizationId,
  } = props;
  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);

  const { organizations: navOrg, isFetching: fetchingNavOrg } =
    useGovtOrganizationLevel({
      index: 0,
      onChange: () => {},
      parentId: "",
      authToken,
    });

  const { organizations: org, isFetching: fetchingOrg } =
    useGovtOrganizationLevel({
      index: 1,
      onChange: () => {},
      parentId: navOrganizationId || "",
      authToken,
    });

  useEffect(() => {
    if (selected?.length) {
      setSelectedLevels(selected);
      return;
    }
    const selectedOrgs: Organization[] = [];
    if (navOrganizationId && navOrg) {
      const navSelected = navOrg.find((org) => org.id === navOrganizationId);
      if (navSelected) selectedOrgs.push(navSelected);
    }
    if (organizationId && org) {
      const selectedOrg = org.find((org) => org.id === organizationId);
      if (selectedOrg) selectedOrgs.push(selectedOrg);
    }
    setSelectedLevels(selectedOrgs);
  }, [navOrg, org, navOrganizationId, organizationId, selected]);

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
      onChange(organization.has_children ? "" : organization.id);
    } else {
      onChange("");
      setSelectedLevels((prev) => prev.slice(0, index));
    }
  };

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
          isFetching={index === 0 ? fetchingNavOrg : fetchingOrg}
        />
      ))}
    </>
  );
}
