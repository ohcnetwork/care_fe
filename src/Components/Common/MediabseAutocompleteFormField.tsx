import { useAsyncOptions } from "../../Common/hooks/useAsyncOptions";
import { listMedibaseMedicines } from "../../Redux/actions";
import { Autocomplete } from "../Form/FormFields/Autocomplete";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";

type Medicine = {
  id: string;
  name: string;
  type: string;
  company: string;
  contents: string;
  cims_class: string;
  atc_classification?: string;
  generic?: string;
};

export default function MedibaseAutocompleteFormField(
  props: FormFieldBaseProps<Medicine>
) {
  const field = useFormFieldPropsResolver(props);
  const { isLoading, options, fetchOptions } = useAsyncOptions<Medicine>("id");

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled}
        value={field.value}
        required
        onChange={field.handleChange}
        options={options(field.value && [field.value])}
        optionLabel={(option) => option.name}
        optionValue={(option) => option}
        onQuery={(query) => fetchOptions(listMedibaseMedicines(query))}
        isLoading={isLoading}
      />
    </FormField>
  );
}
