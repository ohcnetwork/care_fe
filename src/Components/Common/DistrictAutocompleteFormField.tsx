import { FormFieldBaseProps } from "../Form/FormFields/Utils";
import { IState } from "./StateAutocompleteFormField";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { DistrictModel } from "../Facility/models";

type Props = FormFieldBaseProps<DistrictModel["id"]> & {
  placeholder?: string;
  state?: IState["id"];
};

export default function DistrictAutocompleteFormField(props: Props) {
  const { data, loading } = useQuery(routes.getDistrictByState, {
    pathParams: { id: props.state?.toString() ?? "" },
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
