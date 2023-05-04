import { LegacyPhoneNumberField } from "../../Common/HelperInputFields";
import FormField from "./FormField";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";

type Props = FormFieldBaseProps<string> & {
  placeholder?: string;
  autoComplete?: string;
  noAutoFormat?: boolean;
  onlyIndia?: boolean;
  countryCodeEditable?: boolean;
};

const PhoneNumberFormField = (props: Props) => {
  const field = useFormFieldPropsResolver(props as any);
  return (
    <FormField field={field}>
      <LegacyPhoneNumberField
        name={field.name}
        disabled={field.disabled}
        value={field.value}
        onChange={field.handleChange}
        placeholder={props.placeholder}
        onlyIndia={props.onlyIndia}
        turnOffAutoFormat={props.noAutoFormat}
        countryCodeEditable={!!props.countryCodeEditable}
        className="my-0"
        requiredError={field.error ? props.required : false}
      />
    </FormField>
  );
};

export default PhoneNumberFormField;
