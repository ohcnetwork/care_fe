import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FilterState } from "@/hooks/useFilters";

import { FACILITY_TYPES, OptionsType } from "@/common/constants";

import query from "@/Utils/request/query";
import { OrganizationLevel } from "@/pages/Organization/components/OrganizationLevel";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface OrganizationFilterProps {
  selected: string[];
  onChange: (Filter: FilterState, index?: number) => void;
  skipLevels?: number[];
  required?: boolean;
  className?: string;
}

const DEFAULT_ORG_LEVELS = 2;

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

  const { data: rootOrgs } = useQuery<{ results: Organization[] }>({
    queryKey: ["root-organization", selected.length],
    queryFn: query(organizationApi.getPublicOrganizations, {
      queryParams: { level_cache: 1 },
    }),
    enabled: selected.length === 0,
  });

  const isQueriesLoading = orgDetailQueries.some((query) => query.isLoading);

  useEffect(() => {
    if (!isQueriesLoading && selected.length > 0) {
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

  useEffect(() => {
    if (rootOrgs) {
      const validOrg = rootOrgs.results[0];
      if (
        validOrg &&
        validOrg.metadata?.govt_org_type &&
        validOrg.metadata?.govt_org_children_type
      ) {
        setOrgTypes([
          validOrg.metadata.govt_org_type,
          validOrg.metadata.govt_org_children_type,
        ]);
      }
    }
  }, [rootOrgs]);

  // Get parent ID for the current level
  const getParentId = (index: number) => {
    if (index === 0) return "0";
    return selectedLevels[index - 1]?.id;
  };

  const clearSelections = () => {
    setSelectedFacilityType(undefined);
    setOrgTypes((prevTypes) => {
      return [prevTypes[0], prevTypes[1]];
    });
    setSelectedLevels([]);
    onChange({ organization: undefined, facility_type: undefined }, 0);
  };

  return (
    <div className="flex flex-col flex-wrap lg:flex-nowrap sm:flex-row gap-3">
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
        disabled={selected.length === 0}
      >
        <SelectTrigger className="sm:max-w-56 h-[38px]">
          <SelectValue
            placeholder={
              selected.length === 0
                ? t("select_location_first")
                : t("select_facility_type")
            }
          />
        </SelectTrigger>
        <SelectContent>
          {FACILITY_TYPES.map((type) => (
            <SelectItem key={type.id} value={type.text}>
              {type.text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-col gap-2 lg:gap-0 sm:flex-row lg:rounded-md lg:border lg:border-1 lg:border-secondary-500 overflow-clip sm:w-fit w-[calc(100vw-2rem)]">
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
            />
          ),
        )}
      </div>
      <Button
        onClick={clearSelections}
        variant="ghost"
        disabled={
          selectedLevels.length === 0 && selectedFacilityType === undefined
        }
      >
        {t("clear")}
      </Button>
    </div>
  );
}
