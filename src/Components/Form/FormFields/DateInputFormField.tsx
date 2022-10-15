import moment from "moment";
import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
  resolveFormFieldError,
} from "./Utils";

export type ParsableDate = string | number | object | Date | null | undefined;

type Props = FormFieldBaseProps<ParsableDate> & {
  placeholder?: string;
  value?: ParsableDate;
  // prefixIcon?: React.ReactNode;
  // suffixIcon?: React.ReactNode;
  minDate?: ParsableDate;
  maxDate?: ParsableDate;
  disablePast?: boolean;
  disableFuture?: boolean;
};

const DateInputFormField = (props: Props) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);
  const error = resolveFormFieldError(props);

  const bgColor = error ? "bg-red-50" : "bg-gray-200";
  const borderColor = error ? "border-red-500" : "border-gray-200";

  const _momentDate = moment(props.value);
  const value = _momentDate.isValid() ? _momentDate.toString() : undefined;

  return (
    <FormField props={props}>
      <div className="relative">
        <input
          id={props.id}
          className={`form-control text-sm w-full px-4 py-3 rounded placeholder:text-gray-500 ${bgColor} focus:bg-white ${borderColor} focus:border-primary-400 border-2 outline-none ring-0 transition-all duration-200 ease-in`}
          disabled={props.disabled}
          type={"text"}
          placeholder={props.placeholder}
          name={props.name}
          value={value}
          required={props.required}
          onChange={(event) => {
            event.preventDefault();
            handleChange(event.target);
          }}
        />
      </div>
    </FormField>
  );
};

export default DateInputFormField;
