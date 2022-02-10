import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { listFacilityBeds } from "../../Redux/actions";
import { AutoCompleteAsyncField } from "../Common/HelperInputFields";
import { BedModel } from "../Facility/models";
import { LOCATION_BED_TYPES } from "../../Common/constants";
const debounce = require("lodash.debounce");
interface BedSelectProps {
  name: string;
  margin?: string;
  errors: string;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facility?: string;
  location?: string;
  showAll?: boolean;
  selected: BedModel | BedModel[] | null;
  setSelected: (selected: BedModel | BedModel[] | null) => void;
}

export const BedSelect = (props: BedSelectProps) => {
  const {
    name,
    multiple,
    selected,
    setSelected,
    margin,
    errors,
    searchAll,
    className = "",
    facility,
    location,
  } = props;
  const dispatchAction: any = useDispatch();
  const [bedLoading, isBedLoading] = useState(false);
  const [hasSearchText, setHasSearchText] = useState(false);
  const [bedList, setBedList] = useState<Array<BedModel>>([]);

  const handleValueChange = (current: BedModel | BedModel[] | null) => {
    if (!current) {
      setBedList([]);
      isBedLoading(false);
      setHasSearchText(false);
    }
    setSelected(current);
  };

  const handelSearch = (e: any) => {
    isBedLoading(true);
    setHasSearchText(!!e.target.value);
    onBedSearch(e.target.value);
  };

  const onBedSearch = useCallback(
    debounce(async (text: string) => {
      if (text) {
        const params = {
          limit: 50,
          offset: 0,
          search_text: text,
          all: searchAll,
          facility,
          location,
        };

        const res = await dispatchAction(listFacilityBeds(params));

        if (res && res.data) {
          setBedList(res.data.results);
          console.log(res.data.results);
        }
        isBedLoading(false);
      } else {
        setBedList([]);
        isBedLoading(false);
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
      options={bedList}
      onSearch={handelSearch}
      onChange={(e: any, selected: any) => handleValueChange(selected)}
      loading={bedLoading}
      placeholder="Search by beds name"
      noOptionsText={
        hasSearchText
          ? "No beds found, please try again"
          : "Start typing to begin search"
      }
      renderOption={(option: any) => (
        <div>{`${option.name} (${
          LOCATION_BED_TYPES.find((x) => x.id === option.bed_type).name
        })`}</div>
      )}
      getOptionSelected={(option: any, value: any) => option.id === value.id}
      getOptionLabel={(option: any) => option?.name}
      filterOptions={(options: BedModel[]) => options}
      errors={errors}
      className={className}
    />
  );
};
