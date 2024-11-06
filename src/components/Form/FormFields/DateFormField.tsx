import DateInputV2 from "@/components/Common/DateInputV2";
import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";

import { classNames } from "@/Utils/utils";

type Props = FormFieldBaseProps<Date> & {
  containerClassName?: string;
  placeholder?: string;
  max?: Date;
  min?: Date;
  disableFuture?: boolean;
  disablePast?: boolean;
  allowTime?: boolean;
  popOverClassName?: string;
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
        onChange={field.handleChange as (d?: Date) => void}
        disabled={field.disabled}
        max={props.max ?? (props.disableFuture ? new Date() : undefined)}
        min={props.min ?? (props.disablePast ? yesterday() : undefined)}
        placeholder={props.placeholder}
        allowTime={props.allowTime}
        popOverClassName={props.popOverClassName}
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
