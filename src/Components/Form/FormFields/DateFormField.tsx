import { classNames } from "../../../Utils/utils";
import DateInputV2, { DatePickerPosition } from "../../Common/DateInputV2";
import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

type Props = FormFieldBaseProps<Date> & {
  placeholder?: string;
  position?: DatePickerPosition;
};

const DateFormField = ({ position = "CENTER", ...props }: Props) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);
  const name = props.name;

  return (
    <FormField props={props}>
      <DateInputV2
        className={classNames(error && "border-red-500")}
        value={props.value}
        onChange={(value) => handleChange({ name, value })}
        position={position}
        disabled={props.disabled}
        placeholder={props.placeholder}
      />
    </FormField>
  );
};

export default DateFormField;
