import { FormFieldBaseProps } from "../Form/FormFields/Utils";
import AutocompleteFormField from "../Form/FormFields/Autocomplete";
import { DistrictModel, LocalBodyModel } from "../Facility/models";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

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
