import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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

const DEFAULT_ORG_LEVELS = 3;

export default function OrganizationFilter(props: OrganizationFilterProps) {
  const { t } = useTranslation();
  const { onChange, selected, skipLevels } = props;

  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);
  const [orgTypes, setOrgTypes] = useState<string[]>([]);
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
        const validOrg = validOrgs[0];
        if (
          validOrg &&
          validOrg.metadata?.govt_org_type &&
          validOrg.metadata?.govt_org_children_type
        ) {
          setOrgTypes([
            validOrg.metadata?.govt_org_type,
            validOrg.metadata?.govt_org_children_type,
          ]);
        }
      } else {
        setSelectedLevels([]);
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
    setOrgTypes((prevTypes) => {
      return [prevTypes[0], prevTypes[1]];
    });
    setSelectedLevels([]);
    setTimeout(() => {
      onChange({ organization: undefined, facility_type: undefined }, 0);
    }, 0);
  };

  return (
    <div className="gap-3 flex flex-col sm:flex-col">
      <div className="flex flex-row gap-3">
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
          <SelectTrigger className="overflow-hidden sm:min-w-48 sm:max-w-56 w-[calc(100vw-1rem)]">
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
        <Button
          onClick={clearSelections}
          variant="white"
          disabled={
            selectedLevels.length === 0 && selectedFacilityType === undefined
          }
        >
          {t("clear")}
        </Button>
      </div>
      <div className="flex flex-row gap-3">
        {[...Array(Math.min(orgTypes.length + 1, DEFAULT_ORG_LEVELS))].map(
          (_, index) => (
            <OrganizationLevel
              key={`organization-level-${index}`}
              index={index}
              skip={skipLevels?.includes(index) || false}
              selectedLevels={selectedLevels}
              orgTypes={orgTypes}
              setOrgTypes={setOrgTypes}
              onChange={onChange}
              getParentId={getParentId}
              getOrganizationOptions={getOrganizationOptions}
            />
          ),
        )}
      </div>
    </div>
  );
}

interface OrganizationLevelProps {
  index: number;
  skip: boolean;
  selectedLevels: Organization[];
  orgTypes: string[];
  setOrgTypes: React.Dispatch<React.SetStateAction<string[]>>;
  onChange: (Filter: FilterState, index?: number) => void;
  getParentId: (index: number) => string;
  getOrganizationOptions: (orgs?: Organization[]) => AutoCompleteOption[];
}

function OrganizationLevel({
  index,
  skip,
  selectedLevels,
  orgTypes,
  setOrgTypes,
  onChange,
  getParentId,
  getOrganizationOptions,
}: OrganizationLevelProps) {
  const [levelSearch, setLevelSearch] = useDebouncedState("", 500);
  const { t } = useTranslation();
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
  }, [selectedLevels, setOrgTypes]);

  const options = useMemo(() => {
    return getOrganizationOptions(availableOrgs?.results || []);
  }, [availableOrgs?.results, getOrganizationOptions]);

  if (skip) return null;
  const orgType = orgTypes[index];

  return (
    <Autocomplete
      key={`dropdown-${index}`}
      popoverClassName="sm:min-w-64 sm:max-w-72 w-[calc(100vw-2rem)]"
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
