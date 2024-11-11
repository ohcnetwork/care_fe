import AutoCompleteAsync from "@/components/Form/AutoCompleteAsync";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

interface DistrictSelectProps {
  name: string;
  errors: string;
  className?: string;
  multiple?: boolean;
  selected?: string;
  setSelected: (selected: string) => void;
}

function DistrictSelect(props: DistrictSelectProps) {
  return (
    <AutoCompleteAsync
      name={props.name}
      multiple={props.multiple}
      selected={props.selected}
      fetchData={async (search) => {
        const { data } = await request(routes.getDistrictByName, {
          query: { limit: 50, offset: 0, district_name: search },
        });
        return data?.results;
      }}
      onChange={props.setSelected}
      optionLabel={(option) => option.name}
      compareBy="id"
      error={props.errors}
      className={props.className}
    />
  );
}

export default DistrictSelect;
