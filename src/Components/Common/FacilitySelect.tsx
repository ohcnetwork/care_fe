import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { getAllFacilities, getPermittedFacilities } from "../../Redux/actions";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
import { FacilityModel } from "../Facility/models";
import { debounce } from "lodash";
interface FacilitySelectProps {
  name: string;
  errors?: string;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facilityType?: number;
  district?: string;
  showAll?: boolean;
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
    className = "",
    facilityType,
    district,
    errors = "",
  } = props;

  const dispatchAction: any = useDispatch();

  const facilitySearch = useMemo(
    () =>
      debounce(async (text: string) => {
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

        return res?.data?.results;
      }, 300),
    [dispatchAction, searchAll, showAll, facilityType, district]
  );

  return (
    <AutoCompleteAsync
      name={name}
      multiple={multiple}
      selected={selected}
      onChange={setSelected}
      fetchData={facilitySearch}
      getOptionLabel={(option: any) =>
        option.name +
        (option.district_object ? `, ${option.district_object.name}` : "")
      }
      className={className}
      error={errors}
    />
  );
};
