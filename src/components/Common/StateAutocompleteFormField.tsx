import { StateModel } from "@/components/Facility/models";
import AutocompleteFormField from "@/components/Form/FormFields/Autocomplete";
import { FormFieldBaseProps } from "@/components/Form/FormFields/Utils";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

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
