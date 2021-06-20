import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { getDistrictByName, getStates } from "../../../Redux/actions";
import { AutoCompleteAsyncField } from "../../Common/HelperInputFields";
import { PAGE_LIMIT } from "../../../Common/constants.tsx";
const debounce = require("lodash.debounce");

interface DistrictSelectProps {
  name: string;
  errors: string;
  className?: string;
  multiple?: boolean;
  searchAll?: boolean;
  selected: string;
  margin?: string;
  setSelected: (selected: string) => void;
}

function DistrictSelect(props: DistrictSelectProps) {
  const {
    name,
    errors,
    className,
    multiple,
    selected,
    searchAll,
    setSelected,
    margin,
  } = props;
  const [isdistrictLoading, setDistrictLoading] = useState(false);
  const [hasSearchText, setHasSearchText] = useState(false);
  const [districtList, setDistrictList] = useState([]);
  const dispatchAction: any = useDispatch();

  const handleValueChange = (current: string) => {
    if (!current) {
      setDistrictList([]);
      setDistrictLoading(false);
      setHasSearchText(false);
    }
    setSelected(current);
  };

  const handleSearch = (e: any) => {
    setDistrictLoading(true);
    setHasSearchText(!!e.target.value);
    onDistrictSearch(e.target.value);
  };

  const onDistrictSearch = useCallback(
    debounce(async (text: string) => {
      if (text) {
        const params = { limit: PAGE_LIMIT, offset: 0, district_name: text };
        const res = await dispatchAction(getDistrictByName(params));
        if (res && res.data) {
          setDistrictList(res.data.results);
        }
        setDistrictLoading(false);
      } else {
        setDistrictList([]);
        setDistrictLoading(false);
      }
    }, 300),
    []
  );

  return (
    <AutoCompleteAsyncField
      name={name}
      multiple={multiple}
      variant="outlined"
      margin={margin}
      value={selected}
      options={districtList}
      onSearch={handleSearch}
      onChange={(e: any, selected: any) => handleValueChange(selected)}
      loading={isdistrictLoading}
      placeholder="Enter district name"
      noOptionsText={
        hasSearchText
          ? "No district found, please try again"
          : "Start typing to begin search"
      }
      renderOption={(option: any) => <div>{option.name}</div>}
      getOptionSelected={(option: any, value: any) => option.id === value.id}
      getOptionLabel={(option: any) => option.name}
      filterOptions={(options: string) => options}
      errors={errors}
      className={className}
    />
  );
}

export default DistrictSelect;
