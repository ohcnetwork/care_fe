import SelectMenuV2 from "../SelectMenuV2";
import FormField from "./FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "./Utils";

type OptionCallback<T, R> = (option: T) => R;

type Props<T, V = T> = FormFieldBaseProps<V> & {
  placeholder?: React.ReactNode;
  options: T[];
  optionLabel: OptionCallback<T, React.ReactNode>;
  optionSelectedLabel?: OptionCallback<T, React.ReactNode>;
  optionDescription?: OptionCallback<T, React.ReactNode>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
};

const SelectFormField = <T, V>(props: Props<T, V>) => {
  const { name } = props;
  const handleChange = resolveFormFieldChangeEventHandler(props);

  return (
    <FormField props={props}>
      <SelectMenuV2
        id={props.id}
        options={props.options}
        disabled={props.disabled}
        value={props.value}
        placeholder={props.placeholder}
        optionLabel={props.optionLabel}
        optionSelectedLabel={props.optionSelectedLabel}
        optionDescription={props.optionDescription}
        optionIcon={props.optionIcon}
        optionValue={props.optionValue}
        required={props.required}
        onChange={(value: any) => handleChange({ name, value })}
      />
    </FormField>
  );
};

export default SelectFormField;
