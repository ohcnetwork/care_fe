import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { getDistrictByName } from "../../../Redux/actions";
import AutoCompleteAsync from "../../Form/AutoCompleteAsync";

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

  const districtSearch = useCallback(
    async (text: string) => {
      const params = { limit: 50, offset: 0, district_name: text };
      const res = await dispatchAction(getDistrictByName(params));
      return res?.data?.results;
    },
    [dispatchAction]
  );

  return (
    <AutoCompleteAsync
      name={name}
      multiple={multiple}
      selected={selected}
      fetchData={districtSearch}
      onChange={setSelected}
      optionLabel={(option: any) => option.name}
      error={errors}
      className={className}
    />
  );
}

export default DistrictSelect;
