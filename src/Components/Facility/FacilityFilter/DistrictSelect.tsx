import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import { getDistrictByName } from "../../../Redux/actions";
import AutoCompleteAsync from "../../Form/AutoCompleteAsync";
import { debounce } from "lodash";

interface DistrictSelectProps {
  name: string;
  errors: string;
  className?: string;
  multiple?: boolean;
  selected: string;
  setSelected: (selected: string) => void;
}

function DistrictSelect(props: DistrictSelectProps) {
  const { name, errors, className, multiple, selected, setSelected } = props;

  const dispatchAction: any = useDispatch();

  const districtSearch = useMemo(
    () =>
      debounce(async (text: string) => {
        const params = { limit: 50, offset: 0, district_name: text };
        const res = await dispatchAction(getDistrictByName(params));

        return res?.data?.results;
      }, 300),
    [dispatchAction]
  );

  return (
    <AutoCompleteAsync
      name={name}
      multiple={multiple}
      selected={selected}
      fetchData={districtSearch}
      onChange={setSelected}
      getOptionLabel={(option: any) => option.name}
      error={errors}
      className={className}
    />
  );
}

export default DistrictSelect;
