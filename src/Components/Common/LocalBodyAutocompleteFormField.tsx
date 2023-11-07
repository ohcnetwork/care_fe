import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { statusType, useAbortableEffect } from "@/Common/utils";
import { IDistrict } from "@/Components/Common/DistrictAutocompleteFormField";
import AutocompleteFormField from "@/Components/Form/FormFields/Autocomplete";
import { FormFieldBaseProps } from "@/Components/Form/FormFields/Utils";
import { getLocalbodyByDistrict } from "@/Redux/actions";

export type ILocalBody = {
  id: number;
  name: string;
};

type Props = FormFieldBaseProps<ILocalBody["id"]> & {
  placeholder?: string;
  district?: IDistrict["id"];
};

export default function LocalBodyAutocompleteFormField(props: Props) {
  const dispatch = useDispatch<any>();
  const [localBodies, setLocalBodies] = useState<ILocalBody[]>();

  const fetchLocalBodies = useCallback(
    async (status: any) => {
      setLocalBodies(undefined);
      if (!props.district) {
        return;
      }
      const res = await dispatch(
        getLocalbodyByDistrict({ id: props.district })
      );
      if (!status.aborted && res && res.data) {
        setLocalBodies(res.data);
      }
    },
    [dispatch, props.district]
  );

  useAbortableEffect(
    (status: statusType) => fetchLocalBodies(status),
    [props.district]
  );

  return (
    <AutocompleteFormField
      {...props}
      options={localBodies ?? []}
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      isLoading={!!(props.district && localBodies === undefined)}
      disabled={!props.district}
    />
  );
}
