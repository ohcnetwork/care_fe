import { DistrictModel, LocalBodyModel } from "@/components/Facility/models";
import AutocompleteFormField from "@/components/Form/FormFields/Autocomplete";
import { FormFieldBaseProps } from "@/components/Form/FormFields/Utils";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

type Props = FormFieldBaseProps<LocalBodyModel["id"]> & {
  placeholder?: string;
  district?: DistrictModel["id"];
};

export default function LocalBodyAutocompleteFormField(props: Props) {
  const { data, loading } = useQuery(routes.getLocalbodyByDistrict, {
    pathParams: { id: props.district! },
    prefetch: !!props.district,
  });

  return (
    <AutocompleteFormField
      {...props}
      options={data ?? []}
      optionLabel={(option) => option.name}
      optionValue={(option) => option.id}
      isLoading={loading}
      disabled={!props.district}
    />
  );
}
