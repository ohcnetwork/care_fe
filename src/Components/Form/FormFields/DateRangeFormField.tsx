import DateRangeInputV2, { DateRange } from "../../Common/DateRangeInputV2";
import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

type Props = FormFieldBaseProps<DateRange> & {
  placeholder?: string;
};

const DateRangeFormField = (props: Props) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);

  const bgColor = error ? "bg-red-50" : "bg-gray-200";
  const borderColor = error ? "border-red-500" : "border-gray-200";

  const name = props.name;

  return (
    <FormField props={props}>
      <DateRangeInputV2
        className={`${bgColor} ${borderColor}`}
        value={props.value}
        onChange={(value) => handleChange({ name, value })}
        disabled={props.disabled}
      />
    </FormField>
  );
};

export default DateRangeFormField;
