import DateInputV2, { DatePickerPosition } from "../../Common/DateInputV2";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";

import FormField from "./FormField";
import { classNames } from "../../../Utils/utils";

type Props = FormFieldBaseProps<Date> & {
  containerClassName?: string;
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
const DateFormField = (props: Props) => {
  const field = useFormFieldPropsResolver(props);
  return (
    <FormField field={field}>
      <DateInputV2
        className={classNames(field.error && "border-red-500")}
        containerClassName={props.containerClassName}
        id={field.id}
        name={field.name}
        value={
          field.value && typeof field.value === "string"
            ? new Date(field.value)
            : field.value
        }
        onChange={field.handleChange}
        disabled={field.disabled}
        max={props.max ?? (props.disableFuture ? new Date() : undefined)}
        min={props.min ?? (props.disablePast ? yesterday() : undefined)}
        position={props.position ?? "RIGHT"}
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
