import { useQuery } from "@tanstack/react-query";
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

interface OrganizationFilterProps {
  value?: string;
  onChange: (Filter: FilterState) => void;
  required?: boolean;
  authToken?: string;
  className?: string;
}

interface AutoCompleteOption {
  label: string;
  value: string;
}

export default function OrganizationFilter(props: OrganizationFilterProps) {
  const { t } = useTranslation();
  const { onChange, value } = props;
  const [selectedFacilityType, setSelectedFacilityType] = useState<
    OptionsType | undefined
  >();
  const [selectedDistrict, setSelectedDistrict] = useState<Organization>();
  const [selectedLocalBody, setSelectedLocalBody] = useState<Organization>();
  const [searchDistrictQuery, setSearchDistrictQuery] = useDebouncedState(
    "",
    500,
  );
  const [searchLocalBodyQuery, setSearchLocalBodyQuery] = useDebouncedState(
    "",
    500,
  );

  const { data: stateOrganization } = useQuery<Organization>({
    queryKey: ["organization", value],
    queryFn: query(organizationApi.getPublicOrganization, {
      pathParams: {
        id: value ?? "",
      },
    }),
    enabled: !!value,
  });

  const { data: districtOrganizations } = useQuery<{
    results: Organization[];
  }>({
    queryKey: ["organizations-district", value, searchDistrictQuery],
    queryFn: query(organizationApi.getPublicOrganizations, {
      queryParams: {
        parent: stateOrganization?.id ?? "",
      },
    }),
    enabled: !!stateOrganization?.id,
  });

  const { data: localBodyOrganizations } = useQuery<{
    results: Organization[];
  }>({
    queryKey: [
      "organizations-localbody",
      selectedDistrict?.id,
      searchLocalBodyQuery,
    ],
    queryFn: query(organizationApi.getPublicOrganizations, {
      queryParams: {
        parent: selectedDistrict?.id,
      },
    }),
    enabled: !!selectedDistrict?.id,
  });

  useEffect(() => {
    if (selectedDistrict && !selectedLocalBody) {
      onChange({ geo_organization: selectedDistrict.id });
    }
  }, [selectedLocalBody]);

  const getOrganizationOptions = (
    orgs?: Organization[],
  ): AutoCompleteOption[] => {
    if (!orgs) return [];
    return orgs.map((org) => ({
      label: org.name,
      value: org.id,
    }));
  };

  const districtOptions = getOrganizationOptions(
    districtOrganizations?.results,
  );

  const localBodyOptions = getOrganizationOptions(
    localBodyOrganizations?.results,
  );

  console.log(selectedFacilityType);

  return (
    <div className="gap-3 flex flex-row">
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
        <SelectTrigger className="overflow-hidden min-w-56">
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
      <Autocomplete
        value={selectedDistrict?.id ?? ""}
        options={districtOptions}
        onChange={(value: string) => {
          setSelectedDistrict(
            districtOrganizations?.results?.find((org) => org.id === value),
          );
          onChange({ geo_organization: value });
        }}
        onSearch={setSearchDistrictQuery}
        placeholder={t("facility_district_name")}
        align="start"
      />
      <Autocomplete
        disabled={!selectedDistrict?.id}
        value={selectedLocalBody?.id ?? ""}
        options={localBodyOptions}
        onChange={(value: string) => {
          setSelectedLocalBody(
            localBodyOrganizations?.results?.find((org) => org.id === value),
          );
          onChange({ geo_organization: value });
        }}
        onSearch={setSearchLocalBodyQuery}
        placeholder={t("select_local_body")}
        align="start"
      />
      <Button
        variant="outline"
        onClick={() => {
          setSelectedDistrict(undefined);
          setSelectedLocalBody(undefined);
          setSelectedFacilityType(undefined);
          onChange({ geo_organization: undefined, facility_type: undefined });
        }}
      >
        {t("clear")}
      </Button>
    </div>
  );
}
