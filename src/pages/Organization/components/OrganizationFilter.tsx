import { useQuery } from "@tanstack/react-query";
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

import query from "@/Utils/request/query";
import { OrganizationLevel } from "@/pages/Organization/components/OrganizationLevel";
import { FACILITY_TYPES, FacilityType } from "@/types/facility/facility";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface OrganizationFilterProps {
  selected: string | undefined;
  onChange: (Filter: FilterState) => void;
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
    FacilityType | undefined
  >(undefined);

  const { data: orgDetail, isLoading: isOrgDetailLoading } = useQuery({
    queryKey: ["organization-detail", selected],
    queryFn: query(organizationApi.getPublicOrganization, {
      pathParams: { id: selected },
    }),
    enabled: !!selected,
  });

  const { data: rootOrgs } = useQuery({
    queryKey: ["root-organization", selected],
    queryFn: query(organizationApi.getPublicOrganizations, {
      queryParams: { level_cache: 1 },
    }),
    enabled: !!selected,
  });

  useEffect(() => {
    if (!isOrgDetailLoading && selected) {
      const validOrg = orgDetail;
      if (validOrg) {
        if (validOrg.level_cache === 1) {
          setSelectedLevels([validOrg]);
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
          const newOrgs = [];
          let currentOrg = validOrg;
          while (currentOrg.parent && currentOrg.level_cache >= 1) {
            newOrgs.unshift(currentOrg);
            currentOrg = currentOrg.parent as unknown as Organization;
          }
          setSelectedLevels(newOrgs);
        }
      } else {
        setSelectedLevels([]);
      }
    }
  }, [isOrgDetailLoading, selected]);

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

  const clearSelections = () => {
    setSelectedFacilityType(undefined);
    setOrgTypes((prevTypes) => {
      return [prevTypes[0], prevTypes[1]];
    });
    setSelectedLevels([]);
    onChange({ organization: undefined, facility_type: undefined });
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
        disabled={!selected}
      >
        <SelectTrigger className="sm:max-w-56 h-[38px]">
          <SelectValue
            placeholder={
              !selected ? t("select_location_first") : t("select_facility_type")
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
      <div className="flex flex-col gap-2 lg:gap-0 sm:flex-row lg:rounded-md lg:border-1 lg:border-secondary-400 overflow-clip sm:w-fit w-[calc(100vw-2rem)]">
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
