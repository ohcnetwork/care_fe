import { useAsyncOptions } from "../../Common/hooks/useAsyncOptions";
import { HCXActions } from "../../Redux/actions";
import { Autocomplete } from "../Form/FormFields/Autocomplete";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";

export type InsurerOptionModel = {
  status?: string;
  signing_cert_path?: string;
  participant_name: string;
  address?: {
    pincode?: string;
    plot?: string;
    street?: string;
    district?: string;
    state?: string;
    osid?: string;
    landmark?: string;
    village?: string;
  };
  payment_details?: {
    ifsc_code: string;
    account_number: string;
    osid: string;
  };
  encryption_cert_expiry?: number;
  roles?: string[];
  primary_mobile?: string;
  osid?: string;
  osOwner?: string[];
  encryption_cert?: string;
  linked_registry_codes?: string[];
  endpoint_url?: string;
  phone?: string[];
  participant_code: string;
  scheme_code?: string;
  primary_email?: string;
};

type Props = FormFieldBaseProps<InsurerOptionModel> & {
  placeholder?: string;
};

export default function InsurerAutocomplete(props: Props) {
  const field = useFormFieldPropsResolver(props as any);
  const { fetchOptions, isLoading, options } =
    useAsyncOptions<InsurerOptionModel>("participant_code");

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled}
        placeholder={props.placeholder}
        value={field.value}
        onChange={field.handleChange}
        options={options(props.value && [props.value])}
        optionLabel={(option) => option.participant_name}
        optionDescription={(option) => option.participant_code}
        optionValue={(option) => option}
        onQuery={(query) => fetchOptions(HCXActions.payors.list(query))}
        isLoading={isLoading}
      />
    </FormField>
  );
}
