import PhoneInput from "react-phone-input-2";
import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

type Props = FormFieldBaseProps<string> & {
  placeholder?: string;
  value?: string;
  onlyIndia?: boolean | undefined;
};

const PhoneNumberFormField = (props: Props) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);

  const bgColor = error ? "bg-red-50" : "bg-gray-200";
  const borderColor = error ? "border-red-500" : "border-gray-200";

  const name = props.name;
  const countryRestriction = props.onlyIndia ? { onlyCountries: ["in"] } : {};

  return (
    <FormField props={props}>
      <PhoneInput
        inputClass={`form-input ${bgColor} ${borderColor}`}
        countryCodeEditable={false}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(value) => handleChange({ name, value })}
        country="in"
        disabled={props.disabled}
        autoFormat={true}
        {...countryRestriction}
      />
    </FormField>
  );
};

export default PhoneNumberFormField;
