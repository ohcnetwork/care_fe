import { classNames } from "../../../Utils/utils";
import DateRangeInputV2, { DateRange } from "../../Common/DateRangeInputV2";
import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

type Props = FormFieldBaseProps<DateRange> & {
  max?: Date;
  min?: Date;
  disableFuture?: boolean;
  disablePast?: boolean;
};

const DateRangeFormField = (props: Props) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);
  const name = props.name;

  return (
    <FormField props={props}>
      <DateRangeInputV2
        className={classNames(error && "border-red-500")}
        value={props.value}
        onChange={(value) => handleChange({ name, value })}
        min={props.min || (props.disableFuture ? new Date() : undefined)}
        max={props.max || (props.disablePast ? new Date() : undefined)}
        disabled={props.disabled}
      />
    </FormField>
  );
};

export default DateRangeFormField;
