import { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { listFacilityBeds } from "../../Redux/actions";
import { AutoCompleteAsyncField } from "../Common/HelperInputFields";
import { BedModel } from "../Facility/models";
import { LOCATION_BED_TYPES } from "../../Common/constants";
import { debounce } from "lodash";
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
  const [bedList, setBedList] = useState<Array<BedModel>>([]);

  const handleValueChange = (current: BedModel | BedModel[] | null) => {
    if (!current) {
      setBedList([]);
      isBedLoading(false);
    }
    setSelected(current);
  };

  const handelSearch = (e: any) => {
    isBedLoading(true);
    onBedSearch(e.target.value);
  };

  const onBedSearch = useCallback(
    debounce(async (text: string) => {
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
    }, 300),
    []
  );

  useEffect(() => {
    onBedSearch("");
  }, []);

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
      noOptionsText="No beds found, please try again"
      renderOption={(option: any) => (
        <div>
          {`${option.name} (${
            LOCATION_BED_TYPES.find((x) => x.id === option.bed_type)?.name ||
            "Unknown"
          })`}{" "}
          | {option?.location_object?.name}
        </div>
      )}
      getOptionSelected={(option: any, value: any) => option.id === value.id}
      getOptionLabel={(option: any) => option?.name || ""}
      filterOptions={(options: BedModel[]) => options}
      errors={errors}
      className={className}
    />
  );
};
