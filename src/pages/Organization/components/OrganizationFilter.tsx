import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import useDebouncedState from "@/hooks/useDebouncedState";
import { FilterState } from "@/hooks/useFilters";

import { FACILITY_TYPES, OptionsType } from "@/common/constants";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

// TODO: fetch from the backend instead
const govtOrgLevels = ["District", "LocalBody", "Ward"];

interface OrganizationFilterProps {
  selected: string[];
  onChange: (Filter: FilterState, index?: number) => void;
  skipLevels?: number[];
  required?: boolean;
  className?: string;
}

interface AutoCompleteOption {
  label: string;
  value: string;
}

export default function OrganizationFilter(props: OrganizationFilterProps) {
  const { t } = useTranslation();
  const { onChange, selected, skipLevels } = props;

  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);
  const [selectedFacilityType, setSelectedFacilityType] = useState<
    OptionsType | undefined
  >(undefined);

  const orgDetailQuery = (id: string) =>
    query(organizationApi.getPublicOrganization, {
      pathParams: { id },
    });

  const orgDetailQueries = useQueries({
    queries: selected.map((id) => ({
      queryKey: ["organization-detail", id],
      queryFn: orgDetailQuery(id),
      enabled: selected.length > 0,
    })),
  });

  const isQueriesLoading = orgDetailQueries.some((query) => query.isLoading);

  useEffect(() => {
    if (!isQueriesLoading) {
      const validOrgs = orgDetailQueries
        .map((query) => query.data)
        .filter((org): org is Organization => org !== undefined);

      if (validOrgs.length > 0) {
        setSelectedLevels(validOrgs);
      }
    }
  }, [isQueriesLoading, selected]);

  // Get parent ID for the current level
  const getParentId = (index: number) => {
    if (index === 0) return "0";
    return selectedLevels[index - 1]?.id;
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

  const clearSelections = () => {
    setSelectedFacilityType(undefined);
    const firstLevel = selectedLevels[0];
    setSelectedLevels((prev) => {
      const newLevels = prev.slice(0, 1);
      onChange({ organization: firstLevel.id, facility_type: undefined }, 0);
      return newLevels;
    });
  };

  const RenderOrganizationLevel = (
    level: Organization | undefined,
    index: number,
  ) => {
    const skip = skipLevels?.includes(index) || false;
    const [levelSearch, setLevelSearch] = useDebouncedState("", 500);
    const { data: availableOrgs } = useQuery<{ results: Organization[] }>({
      queryKey: ["organizations-available", getParentId(index), levelSearch],
      queryFn: query(organizationApi.getPublicOrganizations, {
        queryParams: {
          ...(index > 0 && { parent: getParentId(index) }),
          ...(index === 0 && { level_cache: 1 }),
          name: levelSearch || undefined,
        },
      }),
      enabled:
        !skip &&
        index <= selectedLevels.length &&
        (index === 0 || selectedLevels[index - 1] !== undefined),
    });
    if (skip) return null;
    const options = getOrganizationOptions(availableOrgs?.results || []);

    return (
      <Autocomplete
        popoverClassName="sm:min-w-56 sm:max-w-60 w-[calc(100vw-2rem)]"
        value={selectedLevels[index]?.id || ""}
        options={options}
        onChange={(value: string) => {
          const selectedOrg = availableOrgs?.results.find(
            (org) => org.id === value,
          );

          if (selectedOrg) {
            onChange({ organization: selectedOrg.id }, index);
            setLevelSearch("");
          }
        }}
        onSearch={(value) => setLevelSearch(value)}
        placeholder={t(`select_${govtOrgLevels[index].toLowerCase()}`)}
        disabled={index > selectedLevels.length}
        align="start"
      />
    );
  };

  return (
    <div className="gap-3 flex flex-col sm:flex-row">
      <Select
        value={selectedFacilityType?.text || ""}
        onValueChange={(value) => {
          setSelectedFacilityType(
            FACILITY_TYPES.find((type) => type.text === value),
          );
          onChange({
            facility_type: FACILITY_TYPES.find((type) => type.text === value)
              ?.id,
          });
        }}
      >
        <SelectTrigger className="overflow-hidden sm:min-w-56 sm:max-w-60 w-[calc(100vw-1rem)]">
          <SelectValue placeholder={t("select_facility_type")} />
        </SelectTrigger>
        <SelectContent>
          {FACILITY_TYPES.map((type) => (
            <SelectItem key={type.id} value={type.text}>
              {type.text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {govtOrgLevels.map((_, index) =>
        RenderOrganizationLevel(selectedLevels[index] || undefined, index),
      )}
      <Button onClick={clearSelections} variant="white">
        {t("clear")}
      </Button>
    </div>
  );
}
