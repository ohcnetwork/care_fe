import { useDispatch } from "react-redux";
import { FormFieldBaseProps } from "../Form/FormFields/Utils";
import { IState } from "./StateAutocompleteFormField";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useCallback, useState } from "react";
import { getDistrictByState } from "../../Redux/actions";

export type IDistrict = {
  id: number;
  name: string;
};

type Props = FormFieldBaseProps<IDistrict["id"]> & {
  placeholder?: string;
  state?: IState["id"];
};

export default function DistrictAutocompleteFormField(props: Props) {
  const dispatch = useDispatch<any>();
  const [districts, setDistricts] = useState<IDistrict[]>();

  const fetchDistricts = useCallback(
    async (status: any) => {
      setDistricts(undefined);
      if (!props.state) {
        return;
      }
      const res = await dispatch(getDistrictByState({ id: props.state }));
      if (!status.aborted && res.data) {
        setDistricts(res.data);
      }
    },
    [dispatch, props.state]
  );

  useAbortableEffect(
    (status: statusType) => fetchDistricts(status),
    [props.state]
  );

  return (
    <AutocompleteFormField
      {...props}
      options={districts ?? []}
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      isLoading={!!(props.state && districts === undefined)}
      disabled={!props.state}
    />
  );
}
