import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";
import MultiSelectMenuV2 from "@/components/Form/MultiSelectMenuV2";
import SelectMenuV2 from "@/components/Form/SelectMenuV2";

type OptionCallback<T, R> = (option: T) => R;

type SelectFormFieldProps<T, V = T> = FormFieldBaseProps<V> & {
  placeholder?: React.ReactNode;
  options: readonly T[];
  position?: "above" | "below";
  optionLabel: OptionCallback<T, React.ReactNode>;
  optionSelectedLabel?: OptionCallback<T, React.ReactNode>;
  optionDescription?: OptionCallback<T, React.ReactNode>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  optionDisabled?: OptionCallback<T, boolean>;
  inputClassName?: string;
};

export const SelectFormField = <T, V>(props: SelectFormFieldProps<T, V>) => {
  const field = useFormFieldPropsResolver<V>(props);
  return (
    <FormField field={field}>
      <SelectMenuV2
        id={field.id}
        options={props.options}
        disabled={field.disabled}
        value={field.value}
        required={field.required}
        onChange={(value: any) => field.handleChange(value)}
        position={props.position}
        placeholder={props.placeholder}
        optionLabel={props.optionLabel}
        inputClassName={props.inputClassName}
        optionSelectedLabel={props.optionSelectedLabel}
        optionDescription={props.optionDescription}
        optionIcon={props.optionIcon}
        optionValue={props.optionValue}
        optionDisabled={props.optionDisabled}
        requiredError={field.error ? props.required : false}
      />
    </FormField>
  );
};

type MultiSelectFormFieldProps<T, V = T> = FormFieldBaseProps<V[]> & {
  placeholder?: React.ReactNode;
  options: readonly T[];
  optionLabel: OptionCallback<T, React.ReactNode>;
  optionSelectedLabel?: OptionCallback<T, React.ReactNode>;
  optionDescription?: OptionCallback<T, React.ReactNode>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  optionDisabled?: OptionCallback<T, boolean>;
};

export const MultiSelectFormField = <T, V>(
  props: MultiSelectFormFieldProps<T, V>,
) => {
  const field = useFormFieldPropsResolver(props);
  return (
    <FormField field={field}>
      <MultiSelectMenuV2
        id={field.id}
        disabled={field.disabled}
        value={field.value}
        onChange={(value: any) => field.handleChange(value)}
        options={props.options}
        placeholder={props.placeholder}
        optionLabel={props.optionLabel}
        optionSelectedLabel={props.optionSelectedLabel}
        optionDescription={props.optionDescription}
        optionIcon={props.optionIcon}
        optionDisabled={props.optionDisabled}
        optionValue={props.optionValue}
      />
    </FormField>
  );
};
