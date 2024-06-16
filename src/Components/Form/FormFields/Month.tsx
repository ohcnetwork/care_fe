import { useEffect, useState } from "react";
import AutocompleteFormField from "./Autocomplete";
import FormField from "./FormField";
import TextFormField from "./TextFormField";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";

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
  const field = useFormFieldPropsResolver(props);

  const [month, setMonth] = useState(field.value?.getMonth());
  const [year, setYear] = useState(field.value?.getFullYear());

  useEffect(() => {
    if (month === undefined || year === undefined) return;
    field.handleChange(new Date(year, month));
  }, [month, year]);

  return (
    <FormField field={field} className="flex items-center gap-1">
      <AutocompleteFormField
        name={field.name + "__month"}
        required={field.required}
        labelClassName="hidden"
        errorClassName="hidden"
        placeholder="Month"
        value={month}
        options={Array.from(Array(12).keys())}
        optionLabel={(month) => MonthLabels[month]}
        optionValue={(month) => month}
        onChange={(event) => setMonth(event.value)}
      />
      <TextFormField
        name={field.name + "__year"}
        required={field.required}
        type="number"
        labelClassName="hidden"
        errorClassName="hidden"
        min={1900}
        placeholder="Year"
        value={year?.toString()}
        onChange={(event) => setYear(parseInt(event.value))}
      />
      {props.suffix && (
        <span className="text-gray-600">{props.suffix(field.value)}</span>
      )}
    </FormField>
  );
};

export default MonthFormField;
