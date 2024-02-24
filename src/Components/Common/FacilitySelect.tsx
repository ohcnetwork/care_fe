import { useCallback } from "react";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
import { FacilityModel } from "../Facility/models";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useAuthUser from "../../Common/hooks/useAuthUser";

interface FacilitySelectProps {
  name: string;
  exclude_user?: string;
  errors?: string | undefined;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facilityType?: number;
  district?: string;
  showAll?: boolean;
  showNOptions?: number;
  freeText?: boolean;
  homeFacility?: boolean;
  selected?: FacilityModel | FacilityModel[] | null;
  setSelected: (selected: FacilityModel | FacilityModel[] | null) => void;
}

export const FacilitySelect = (props: FacilitySelectProps) => {
  const {
    name,
    exclude_user,
    multiple,
    selected,
    setSelected,
    searchAll,
    showAll = true,
    showNOptions = 10,
    className = "",
    facilityType,
    district,
    freeText = false,
    homeFacility = false,
    errors = "",
  } = props;
  const authUser = useAuthUser();
  const showAllFacilityUsers = ["DistrictAdmin", "StateAdmin"];

  const facilitySearch = useCallback(
    async (text: string) => {
      const query = {
        limit: 50,
        offset: 0,
        search_text: text,
        all: searchAll,
        name: "",
        facility_type: facilityType,
        exclude_user: exclude_user,
        district,
      };

      const { data } = await request(
        showAll ? routes.getAllFacilities : routes.getPermittedFacilities,
        { query }
      );

      if (
        homeFacility &&
        !showAllFacilityUsers.includes(authUser.user_type) &&
        authUser.home_facility_object?.name
      ) {
        query["name"] = authUser.home_facility_object?.name;
        query["limit"] = 1;
      }

      if (freeText)
        data?.results?.push({
          id: -1,
          name: text,
        });
      return data?.results;
    },
    [
      searchAll,
      showAll,
      facilityType,
      district,
      exclude_user,
      freeText,
      authUser.home_facility_object?.name,
      authUser.user_type,
      homeFacility,
    ]
  );

  return (
    <AutoCompleteAsync
      name={name}
      multiple={multiple}
      selected={selected}
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
    />
  );
};
