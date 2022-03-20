import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { listFacilityAssetLocation } from "../../Redux/actions";
import { AutoCompleteAsyncField } from "../Common/HelperInputFields";
import { AssetLocationObject } from "../Assets/AssetTypes";
const debounce = require("lodash.debounce");
interface LocationSelectProps {
  name: string;
  margin?: string;
  errors: string;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facilityId: number;
  showAll?: boolean;
  selected: AssetLocationObject | AssetLocationObject[] | null;
  setSelected: (
    selected: AssetLocationObject | AssetLocationObject[] | null
  ) => void;
}

export const LocationSelect = (props: LocationSelectProps) => {
  const {
    name,
    multiple,
    selected,
    setSelected,
    margin,
    errors,
    searchAll,
    className = "",
    facilityId,
  } = props;
  const dispatchAction: any = useDispatch();
  const [facilityLoading, isFacilityLoading] = useState(false);
  const [hasSearchText, setHasSearchText] = useState(false);
  const [locationList, setLocationList] = useState<Array<AssetLocationObject>>(
    []
  );

  const handleValueChange = (
    current: AssetLocationObject | AssetLocationObject[] | null
  ) => {
    if (!current) {
      setLocationList([]);
      isFacilityLoading(false);
      setHasSearchText(false);
    }
    setSelected(current);
  };

  const handelSearch = (e: any) => {
    isFacilityLoading(true);
    setHasSearchText(!!e.target.value);
    onFacilitySearch(e.target.value);
  };

  const onFacilitySearch = useMemo(
    () =>
      debounce(async (text: string) => {
        if (text) {
          const params = {
            limit: 50,
            offset: 0,
            search_text: text,
            all: searchAll,
          };

          const res = await dispatchAction(
            listFacilityAssetLocation(params, {
              facility_external_id: facilityId,
            })
          );

          if (res && res.data) {
            setLocationList(res.data.results);
          }
          isFacilityLoading(false);
        } else {
          setLocationList([]);
          isFacilityLoading(false);
        }
      }, 300),
    [dispatchAction, facilityId, searchAll]
  );

  return (
    <AutoCompleteAsyncField
      name={name}
      multiple={multiple}
      variant="outlined"
      margin={margin}
      value={selected}
      options={locationList}
      onSearch={handelSearch}
      onChange={(e: any, selected: any) => handleValueChange(selected)}
      loading={facilityLoading}
      placeholder="Search by location name"
      noOptionsText={
        hasSearchText
          ? "No Location found, please try again"
          : "Start typing to begin search"
      }
      renderOption={(option: any) => (
        <div>
          {option.name}
          {option.district_object ? `, ${option.district_object.name}` : ""}
        </div>
      )}
      getOptionSelected={(option: any, value: any) => option.id === value.id}
      getOptionLabel={(option: any) =>
        option.name +
        (option.district_object ? `, ${option.district_object.name}` : "")
      }
      filterOptions={(options: AssetLocationObject[]) => options}
      errors={errors}
      className={className}
    />
  );
};
