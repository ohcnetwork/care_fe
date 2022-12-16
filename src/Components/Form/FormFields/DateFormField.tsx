import DateInputV2, { DatePickerPosition } from "../../Common/DateInputV2";
import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

type Props = FormFieldBaseProps<Date> & {
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  position?: DatePickerPosition;
};

const DateFormField = ({ position = "CENTER", ...props }: Props) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);

  const bgColor = error ? "bg-red-50" : "bg-gray-200";
  const borderColor = error ? "border-red-500" : "border-gray-200";

  const name = props.name;

  return (
    <FormField props={props}>
      <DateInputV2
        className={`${bgColor} ${borderColor}`}
        value={props.value}
        onChange={(value) => handleChange({ name, value })}
        position={position}
        max={props.maxDate}
        min={props.minDate}
        disabled={props.disabled}
        placeholder={props.placeholder}
      />
    </FormField>
  );
};

export default DateFormField;
