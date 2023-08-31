import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  getAllFacilities,
  getPermittedFacilities,
  getUserListFacility,
} from "../../Redux/actions";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
import { FacilityModel } from "../Facility/models";

interface FacilitySelectProps {
  name: string;
  errors?: string | undefined;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facilityType?: number;
  district?: string;
  showAll?: boolean;
  showNOptions?: number;
  freeText?: boolean;
  username?: string;
  selected: FacilityModel | FacilityModel[] | null;
  setSelected: (selected: FacilityModel | FacilityModel[] | null) => void;
}

export const FacilitySelect = (props: FacilitySelectProps) => {
  const {
    name,
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
    errors = "",
    username,
  } = props;

  const dispatchAction: any = useDispatch();

  const facilitySearch = useCallback(
    async (text: string) => {
      const params = {
        limit: 50,
        offset: 0,
        search_text: text,
        all: searchAll,
        facility_type: facilityType,
        district,
      };

      const res = await dispatchAction(
        showAll ? getAllFacilities(params) : getPermittedFacilities(params)
      );

      const linkedFacilities = await dispatchAction(
        getUserListFacility({ username })
      );
      const linkedIDs: string[] = [];
      linkedFacilities.data.map((fac: any) => linkedIDs.push(fac.id));

      if (freeText)
        res?.data?.results?.push({
          id: -1,
          name: text,
        });
      return res?.data?.results.filter(
        (facility: any) => !linkedIDs.includes(facility.id)
      );
    },
    [dispatchAction, searchAll, showAll, facilityType, district]
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
