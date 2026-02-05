import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";

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
            validOrg.metadata?.govt_org_type &&
            validOrg.metadata?.govt_org_children_type
          ) {
            setOrgTypes([
              validOrg.metadata.govt_org_type,
              validOrg.metadata.govt_org_children_type,
            ]);
          }
        } else {
          const newOrgs: Organization[] = [];
          let currentOrg = validOrg;
          while (currentOrg.parent && currentOrg.level_cache >= 1) {
            newOrgs.unshift(currentOrg);
            currentOrg = currentOrg.parent as Organization;
          }
          setSelectedLevels(newOrgs);
        }
      } else {
        setSelectedLevels([]);
      }
    }
  }, [isOrgDetailLoading, selected, orgDetail]);

  useEffect(() => {
    if (rootOrgs) {
      const validOrg = rootOrgs.results[0];
      if (
        validOrg?.metadata?.govt_org_type &&
        validOrg?.metadata?.govt_org_children_type
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
    setOrgTypes((prev) => [prev[0], prev[1]]);
    setSelectedLevels([]);
    onChange({ organization: undefined, facility_type: undefined });
  };

  const levelCount = selectedLevels.length
    ? Math.min(selectedLevels.length + 1, DEFAULT_ORG_LEVELS)
    : 1;

  return (
    <div className="flex flex-col flex-wrap lg:flex-nowrap sm:flex-row items-center gap-3">
      <div className="flex flex-col sm:flex-row items-stretch rounded-md border border-secondary-400 overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-secondary-400 w-full sm:w-fit [&_button]:border-none [&_button]:rounded-none [&_button]:shadow-none">
        {[...Array(levelCount)].map((_, index) => (
          <div key={`org-level-${index}`} className="w-full sm:w-64">
            <OrganizationLevel
              index={index}
              skip={skipLevels?.includes(index) || false}
              selectedLevels={selectedLevels}
              orgTypes={orgTypes}
              setOrgTypes={setOrgTypes}
              onChange={(val) => {
                const parentId =
                  index > 0 ? selectedLevels[index - 1]?.id : undefined;

                if (val.organization === parentId) {
                  setSelectedLevels((prev) => prev.slice(0, index));
                  setOrgTypes((prev) => prev.slice(0, index + 1));
                }

                onChange(val);
              }}
            />
          </div>
        ))}

        {selected && (
          <div className="w-full sm:w-64">
            <Autocomplete
              options={FACILITY_TYPES.map((type) => ({
                label: type.text,
                value: String(type.id),
              }))}
              value={
                selectedFacilityType ? String(selectedFacilityType.id) : ""
              }
              className="h-full border-none rounded-none shadow-none"
              onChange={(val) => {
                if (!val) {
                  setSelectedFacilityType(undefined);
                  onChange({ facility_type: undefined });
                } else {
                  const type = FACILITY_TYPES.find((t) => String(t.id) === val);
                  setSelectedFacilityType(type);
                  onChange({ facility_type: val });
                }
              }}
              showClearButton={!!selectedFacilityType}
              placeholder={t("select_facility_type")}
            />
          </div>
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
