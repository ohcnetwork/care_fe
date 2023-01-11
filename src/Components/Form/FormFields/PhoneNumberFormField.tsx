import { PhoneNumberField } from "../../Common/HelperInputFields";
import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "./Utils";

type Props = FormFieldBaseProps<string> & {
  placeholder?: string;
  autoComplete?: string;
  noAutoFormat?: boolean;
  tollFree?: boolean;
  onlyIndia?: boolean;
  countryCodeEditable?: boolean;
};

const PhoneNumberFormField = (props: Props) => {
  const { name } = props;
  const handleChange = resolveFormFieldChangeEventHandler(props);

  return (
    <FormField props={props}>
      <PhoneNumberField
        placeholder={props.placeholder}
        value={props.value}
        onChange={(value: string) => handleChange({ name, value })}
        onlyIndia={props.onlyIndia}
        turnOffAutoFormat={props.noAutoFormat}
        disabled={props.disabled}
        enableTollFree={props.tollFree}
        countryCodeEditable={!!props.countryCodeEditable}
        className="my-0"
        name={name}
      />
    </FormField>
  );
};

export default PhoneNumberFormField;
