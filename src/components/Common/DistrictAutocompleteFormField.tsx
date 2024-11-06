import { DistrictModel, StateModel } from "@/components/Facility/models";
import AutocompleteFormField from "@/components/Form/FormFields/Autocomplete";
import { FormFieldBaseProps } from "@/components/Form/FormFields/Utils";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

type Props = FormFieldBaseProps<DistrictModel["id"]> & {
  placeholder?: string;
  state?: StateModel["id"];
};

export default function DistrictAutocompleteFormField(props: Props) {
  const { data, loading } = useQuery(routes.getDistrictByState, {
    pathParams: { id: props.state! },
    prefetch: !!props.state,
  });

  return (
    <AutocompleteFormField
      {...props}
      options={data ?? []}
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      isLoading={loading}
      disabled={!props.state}
    />
  );
}
