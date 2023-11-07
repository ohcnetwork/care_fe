import { useAsyncOptions } from "@/Common/hooks/useAsyncOptions";
import { Autocomplete } from "@/Components/Form/FormFields/Autocomplete";
import FormField from "@/Components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/Components/Form/FormFields/Utils";
import { HCXActions } from "@/Redux/actions";

export type InsurerOptionModel = {
  name: string;
  code: string;
};

type Props = FormFieldBaseProps<InsurerOptionModel> & {
  placeholder?: string;
};

export default function InsurerAutocomplete(props: Props) {
  const field = useFormFieldPropsResolver(props as any);
  const { fetchOptions, isLoading, options } =
    useAsyncOptions<InsurerOptionModel>("code");

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
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
