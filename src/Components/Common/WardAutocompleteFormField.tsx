import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { statusType, useAbortableEffect } from "@/Common/utils";
import { ILocalBody } from "@/Components/Common/LocalBodyAutocompleteFormField";
import AutocompleteFormField from "@/Components/Form/FormFields/Autocomplete";
import { FormFieldBaseProps } from "@/Components/Form/FormFields/Utils";
import { getWardByLocalBody } from "@/Redux/actions";

export type IWard = {
  id: number;
  name: string;
};

type Props = FormFieldBaseProps<IWard["id"]> & {
  placeholder?: string;
  local_body?: ILocalBody["id"];
};

export default function WardAutocompleteFormField(props: Props) {
  const dispatch = useDispatch<any>();
  const [Ward, setWard] = useState<IWard[]>();

  const fetchWard = useCallback(
    async (status: any) => {
      setWard(undefined);
      if (!props.local_body) {
        return;
      }
      const res = await dispatch(getWardByLocalBody({ id: props.local_body }));
      if (!status.aborted && res.data) {
        setWard(res.data);
      }
    },
    [dispatch, props.local_body]
  );

  useAbortableEffect(
    (status: statusType) => fetchWard(status),
    [props.local_body]
  );

  return (
    <AutocompleteFormField
      {...props}
      options={Ward ?? []}
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      isLoading={!!(props.local_body && Ward === undefined)}
      disabled={!props.local_body}
    />
  );
}
