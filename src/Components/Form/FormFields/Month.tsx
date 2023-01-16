import AutocompleteFormField from "./Autocomplete";
import FormField from "./FormField";
import TextFormField from "./TextFormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "./Utils";

type Props = FormFieldBaseProps<Date> & {
  suffix?: (value?: Date) => React.ReactNode;
};

const MonthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MonthFormField = (props: Props) => {
  const handleChange = resolveFormFieldChangeEventHandler(props);

  return (
    <FormField props={props} className="flex items-center gap-1">
      <AutocompleteFormField
        name={props.name}
        required={props.required}
        labelClassName="hidden"
        errorClassName="hidden"
        label=""
        error=""
        placeholder="Month"
        value={props.value}
        options={Array.from(Array(12).keys())}
        optionLabel={(month) => MonthLabels[month]}
        optionValue={(index) => {
          const date = props.value ? new Date(props.value) : new Date();
          date.setMonth(index);
          return date;
        }}
        onChange={handleChange}
      />
      <TextFormField
        name={props.name}
        type="number"
        labelClassName="hidden"
        errorClassName="hidden"
        label=""
        error=""
        min={1900}
        placeholder="Year"
        value={props.value?.getFullYear().toString()}
        onChange={(event) => {
          const value = props.value ? new Date(props.value) : new Date();
          value.setFullYear(Number(event.value));
          handleChange({ name: event.name, value });
        }}
      />
      {props.suffix && (
        <span className="text-gray-600">{props.suffix(props.value)}</span>
      )}
    </FormField>
  );
};

export default MonthFormField;
