import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { getLocalbodyByDistrict } from "../../../Redux/actions";
import { AutoCompleteAsyncField } from "../../Common/HelperInputFields";

interface LocalBodySelectProps {
  name: string;
  errors?: string;
  className?: string;
  multiple?: boolean;
  searchAll?: boolean;
  selected: string;
  margin?: string;
  district?: string;
  isLoading?: (loading: boolean) => void;
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
    district,
  } = props;
  const [loadBodyLoading, isLocalBodyLoading] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [hasSearchText, setHasSearchText] = useState(false);
  const [districtLocalBodies, setDistrictLocalBodies] = useState([]);
  const [localBodyList, setLocalBodyList] = useState([]);
  const dispatchAction: any = useDispatch();

  const handleValueChange = (local_body: any) => {
    setSelectedObject(local_body);
    setSelected(local_body?.id);
  };

  const handleSearch = (e: any) => {
    const searchTerm = e.target.value;
    isLocalBodyLoading(true);
    setHasSearchText(!!searchTerm);

    setLocalBodyList(
      districtLocalBodies.filter((local_body: any) =>
        local_body.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    isLocalBodyLoading(false);
  };

  useEffect(() => {
    const fetchLocalbodies = async () => {
      if (Number(district)) {
        const res = await dispatchAction(
          getLocalbodyByDistrict({ id: district })
        );
        if (res && res.data) {
          setDistrictLocalBodies(res.data);
          setLocalBodyList(res.data);

          if (selected) {
            setSelectedObject(
              res.data.find((local_body: any) => local_body.id == selected) ||
                null
            );
          }
        }
      } else {
        setDistrictLocalBodies([]);
        setLocalBodyList([]);
      }
    };

    isLocalBodyLoading(true);
    fetchLocalbodies();
    isLocalBodyLoading(false);
  }, [dispatchAction, district]);

  return (
    <AutoCompleteAsyncField
      name={name}
      multiple={multiple}
      variant="outlined"
      margin={margin}
      value={selectedObject}
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
