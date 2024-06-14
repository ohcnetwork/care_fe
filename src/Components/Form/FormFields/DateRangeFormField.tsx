import { classNames } from "../../../Utils/utils";
import DateRangeInputV2, { DateRange } from "../../Common/DateRangeInputV2";
import FormField from "./FormField";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";

type Props = FormFieldBaseProps<DateRange> & {
  max?: Date;
  min?: Date;
  disableFuture?: boolean;
  disablePast?: boolean;
};

/**
 * A FormField to pick a date range.
 *
 * Example usage:
 *
 * ```jsx
 * <DateRangeFormField
 *   {...field("user_date_of_birth_prediction")}
 *   label="Predicted date of birth"
 *   required
 *   disablePast // equivalent to min={new Date()}
 * />
 * ```
 */
const DateRangeFormField = (props: Props) => {
  const field = useFormFieldPropsResolver(props);
  return (
    <FormField field={field}>
      <DateRangeInputV2
        name={field.name}
        className={classNames(field.error && "border-red-500")}
        value={field.value}
        onChange={field.handleChange}
        disabled={field.disabled}
        min={props.min || (props.disableFuture ? new Date() : undefined)}
        max={props.max || (props.disablePast ? new Date() : undefined)}
      />
    </FormField>
  );
};

export default DateRangeFormField;
