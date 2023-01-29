import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { listFacilityBeds } from "../../Redux/actions";
import { BedModel } from "../Facility/models";
import { LOCATION_BED_TYPES } from "../../Common/constants";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";
interface BedSelectProps {
  name: string;
  error?: string | undefined;
  className?: string;
  searchAll?: boolean;
  unoccupiedOnly?: boolean;
  multiple?: boolean;
  facility?: string;
  location?: string;
  showAll?: boolean;
  showNOptions?: number;
  selected: BedModel | BedModel[] | null;
  setSelected: (selected: BedModel | BedModel[] | null) => void;
}

export const BedSelect = (props: BedSelectProps) => {
  const {
    name,
    multiple,
    selected,
    setSelected,
    error,
    searchAll,
    unoccupiedOnly,
    className = "",
    facility,
    location,
    showNOptions = 10,
  } = props;
  const dispatchAction: any = useDispatch();

  const onBedSearch = useCallback(
    async (text: string) => {
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
        let beds = res.data.results;
        if (unoccupiedOnly) {
          beds = beds.filter((bed: BedModel) => bed?.is_occupied === false);
        }

        return beds;
      }
    },
    [dispatchAction, facility, location, searchAll, unoccupiedOnly]
  );

  return (
    <AutoCompleteAsync
      name={name}
      multiple={multiple}
      selected={selected}
      onChange={setSelected}
      showNOptions={showNOptions}
      placeholder="Search by beds name"
      fetchData={onBedSearch}
      optionLabel={(option: any) => {
        if (Object.keys(option).length === 0) return "";
        return (
          `${option.name} ${
            LOCATION_BED_TYPES.find((x) => x.id === option.bed_type)?.name ||
            "Unknown"
          } ` || option?.location_object?.name
        );
      }}
      compareBy="id"
      error={error}
      className={className}
    />
  );
};
