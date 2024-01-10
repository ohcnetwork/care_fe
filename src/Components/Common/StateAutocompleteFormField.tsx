import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import { FormFieldBaseProps } from "../Form/FormFields/Utils";
import { StateModel } from "../Facility/models";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

type Props = FormFieldBaseProps<StateModel["id"]> & {
  placeholder?: string;
};

export default function StateAutocompleteFormField(props: Props) {
  const { data, loading } = useQuery(routes.statesList);

  return (
    <AutocompleteFormField
      {...props}
      options={data?.results ?? []}
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      isLoading={loading}
    />
  );
}
