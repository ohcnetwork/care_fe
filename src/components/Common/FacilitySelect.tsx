import { t } from "i18next";
import { useCallback } from "react";

import { FacilityModel } from "@/components/Facility/models";
import AutoCompleteAsync from "@/components/Form/AutoCompleteAsync";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface BaseFacilitySelectProps {
  name: string;
  exclude_user?: string;
  errors?: string | undefined;
  className?: string;
  required?: boolean;
  searchAll?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  facilityType?: number;
  district?: string;
  state?: string;
  showAll?: boolean;
  showNOptions?: number | undefined;
  freeText?: boolean;
  allowNone?: boolean;
  placeholder?: string;
  filter?: (facilities: FacilityModel) => boolean;
  id?: string;
}

interface SingleFacilitySelectProps extends BaseFacilitySelectProps {
  multiple?: false;
  selected: FacilityModel | null;
  setSelected: (selected: FacilityModel | null) => void;
}

interface MultipleFacilitySelectProps extends BaseFacilitySelectProps {
  multiple: true;
  selected: FacilityModel[];
  setSelected: (selected: FacilityModel[] | null) => void;
}

type FacilitySelectProps =
  | SingleFacilitySelectProps
  | MultipleFacilitySelectProps;

export const FacilitySelect = ({
  name,
  exclude_user,
  required,
  multiple,
  selected,
  setSelected,
  searchAll,
  disabled = false,
  showAll = true,
  showNOptions,
  className = "",
  facilityType,
  district,
  state,
  allowNone = false,
  freeText = false,
  errors = "",
  placeholder,
  filter,
  id,
}: FacilitySelectProps) => {
  const facilitySearch = useCallback(
    async (text: string) => {
      const query = {
        limit: 50,
        offset: 0,
        search_text: text,
        all: searchAll,
        facility_type: facilityType,
        exclude_user: exclude_user,
        district,
        state,
      };

      const { data } = await request(
        showAll ? routes.getAllFacilities : routes.getPermittedFacilities,
        { query },
      );

      if (freeText)
        data?.results?.push({
          name: text,
        });

      if (allowNone)
        return [
          { name: t("no_home_facility"), id: "NONE" },
          ...(data?.results || []),
        ];

      return data?.results;
    },
    [searchAll, showAll, facilityType, district, exclude_user, freeText],
  );

  return (
    <AutoCompleteAsync
      id={id}
      placeholder={placeholder}
      name={name}
      required={required}
      multiple={multiple}
      selected={selected}
      disabled={disabled}
      onChange={setSelected}
      fetchData={facilitySearch}
      showNOptions={showNOptions}
      optionLabel={(option: any) =>
        option.name +
        (option.district_object ? `, ${option.district_object.name}` : "")
      }
      compareBy="id"
      className={className}
      error={errors}
      filter={filter}
    />
  );
};
