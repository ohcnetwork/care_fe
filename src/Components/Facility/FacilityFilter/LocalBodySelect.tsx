import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  getLocalbodyByDistrict,
  getLocalbodyByName,
} from "../../../Redux/actions";
import { AutoCompleteAsyncField } from "../../Common/HelperInputFields";
const debounce = require("lodash.debounce");

interface LocalBodySelectProps {
  name: string;
  errors: string;
  className?: string;
  multiple?: boolean;
  searchAll?: boolean;
  selected: string;
  margin?: string;
  setSelected: (selected: string) => void;
}

function LocalBodySelect(props: LocalBodySelectProps) {
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
  const [loadBodyLoading, isLocalBodyLoading] = useState(false);
  const [hasSearchText, setHasSearchText] = useState(false);
  const [localBodyList, setLocalBodyList] = useState([]);
  const dispatchAction: any = useDispatch();

  const handleValueChange = (current: string) => {
    if (!current) {
      setLocalBodyList([]);
      isLocalBodyLoading(false);
      setHasSearchText(false);
    }
    setSelected(current);
  };

  const handleSearch = (e: any) => {
    isLocalBodyLoading(true);
    setHasSearchText(!!e.target.value);
    onLocalBodySearch(e.target.value);
  };

  const onLocalBodySearch = useCallback(
    debounce(async (text: string) => {
      if (text) {
        const params = { limit: 50, offset: 0, local_body_name: text };
        const res = await dispatchAction(getLocalbodyByName(params));
        if (res && res.data) {
          setLocalBodyList(res.data.results);
        }
        isLocalBodyLoading(false);
      } else {
        setLocalBodyList([]);
        isLocalBodyLoading(false);
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
      options={localBodyList}
      onSearch={handleSearch}
      onChange={(e: any, selected: any) => handleValueChange(selected)}
      loading={loadBodyLoading}
      placeholder="Enter local body name"
      noOptionsText={
        hasSearchText
          ? "No local body found, please try again"
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

export default LocalBodySelect;
