import { classNames } from "../../../Utils/utils";
import DateInputV2, { DatePickerPosition } from "../../Common/DateInputV2";
import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "./Utils";

type Props = FormFieldBaseProps<Date> & {
  placeholder?: string;
  max?: Date;
  min?: Date;
  position?: DatePickerPosition;
  disableFuture?: boolean;
  disablePast?: boolean;
};

/**
 * A FormField to pick date.
 *
 * Example usage:
 *
 * ```jsx
 * <DateFormField
 *   {...field("user_date_of_birth")}
 *   label="Date of birth"
 *   required
 *   disableFuture // equivalent to max={new Date()}
 * />
 * ```
 */
const DateFormField = ({ position = "RIGHT", ...props }: Props) => {
  return (
    <FormField props={props}>
      <DateInputV2
        className={classNames(props.error && "border-red-500")}
        id={props.id}
        value={props.value}
        onChange={resolveFormFieldChangeEventHandler(props)}
        max={props.max || (props.disableFuture ? new Date() : undefined)}
        min={props.min || (props.disablePast ? yesterday() : undefined)}
        position={position}
        disabled={props.disabled}
        placeholder={props.placeholder}
      />
    </FormField>
  );
};

export default DateFormField;

const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
};
