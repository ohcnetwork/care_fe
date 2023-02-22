import { useAsyncOptions } from "../../Common/hooks/useAsyncOptions";
import { HCXActions } from "../../Redux/actions";
import { Autocomplete } from "../Form/FormFields/Autocomplete";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";

export type InsurerOptionModel = {
  id: string;
  name: string;
};

type Props = FormFieldBaseProps<InsurerOptionModel> & {
  for: keyof InsurerOptionModel;
  placeholder?: string;
};

export default function InsurerAutocomplete(props: Props) {
  const field = useFormFieldPropsResolver(props as any);
  const { fetchOptions, isLoading, options } =
    useAsyncOptions<InsurerOptionModel>("id");

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled}
        placeholder={props.placeholder}
        value={field.value}
        onChange={field.handleChange}
        options={options(props.value && [props.value])}
        optionLabel={(option) => (props.for === "id" ? option.id : option.name)}
        optionDescription={(option) =>
          props.for === "id" ? option.name : option.id
        }
        optionValue={(option) => option}
        onQuery={(query) =>
          fetchOptions(HCXActions.listInsurersFromHCXRegistry(query))
        }
        isLoading={isLoading}
      />
    </FormField>
  );
}
