import { useAsyncOptions } from "../../Common/hooks/useAsyncOptions";
import { HCXActions } from "../../Redux/actions";
import { Autocomplete } from "../Form/FormFields/Autocomplete";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";

export type InsurerOptionModel = {
  name: string;
  code: string;
};

type Props = FormFieldBaseProps<InsurerOptionModel> & {
  placeholder?: string;
};

export default function InsurerAutocomplete(props: Props) {
  const field = useFormFieldPropsResolver(props);
  const { fetchOptions, isLoading, options } =
    useAsyncOptions<InsurerOptionModel>("code");

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        // Voluntarily casting type as true to ignore type errors.
        required={field.required as true}
        disabled={field.disabled}
        placeholder={props.placeholder}
        value={field.value}
        onChange={field.handleChange}
        options={options(props.value && [props.value])}
        optionLabel={(option) => option.name}
        optionDescription={(option) => option.code}
        optionValue={(option) => option}
        onQuery={(query) => fetchOptions(HCXActions.payors.list(query))}
        isLoading={isLoading}
      />
    </FormField>
  );
}
