import React, { useEffect, useState } from "react";
import { Combobox } from "@headlessui/react";
import { DropdownTransition } from "../../Common/components/HelperComponents";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { dropdownOptionClassNames } from "../MultiSelectMenuV2";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "./Utils";
import FormField from "./FormField";

type OptionCallback<T, R> = (option: T) => R;

type AutocompleteFormFieldProps<T, V> = FormFieldBaseProps<V> & {
  placeholder?: string;
  options: T[];
  optionLabel: OptionCallback<T, string>;
  optionValue?: OptionCallback<T, V>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  onQuery?: (query: string) => void;
  dropdownIcon?: React.ReactNode | undefined;
};

const AutocompleteFormField = <T, V>(
  props: AutocompleteFormFieldProps<T, V>
) => {
  return (
    <FormField props={props}>
      <Autocomplete
        id={props.id}
        options={props.options}
        disabled={props.disabled}
        value={props.value}
        placeholder={props.placeholder}
        optionLabel={props.optionLabel}
        optionIcon={props.optionIcon}
        optionValue={props.optionValue}
        className={props.className}
        required={props.required}
        onQuery={props.onQuery}
        onChange={resolveFormFieldChangeEventHandler<any>(props)}
      />
    </FormField>
  );
};

export default AutocompleteFormField;

type AutocompleteProps<T, V = T> = {
  id?: string;
  options: T[];
  disabled?: boolean | undefined;
  value: V | undefined;
  placeholder?: string;
  optionLabel: OptionCallback<T, string>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  className?: string;
  onQuery?: (query: string) => void;
  isLoading?: boolean;
} & (
  | {
      required?: false;
      onChange: OptionCallback<V | undefined, void>;
    }
  | {
      required: true;
      onChange: OptionCallback<V, void>;
    }
);

/**
 * Avoid using this component directly. Use `AutocompleteFormField` instead as
 * its API is easier to use and compliant with `FormField` based components.
 *
 * Use this only when you want to hack into the design and get more
 * customizability.
 */
export const Autocomplete = <T, V>(props: AutocompleteProps<T, V>) => {
  const [query, setQuery] = useState(""); // Ensure lower case
  useEffect(() => {
    props.onQuery && props.onQuery(query);
  }, [query]);

  const options = props.options.map((option) => {
    const label = props.optionLabel(option);
    return {
      label,
      search: label.toLowerCase(),
      icon: props.optionIcon && props.optionIcon(option),
      value: props.optionValue ? props.optionValue(option) : option,
    };
  });

  const value = options.find((o) => props.value == o.value);
  const filteredOptions = options.filter((o) => o.search.includes(query));

  return (
    <div className={props.className} id={props.id}>
      <Combobox
        disabled={props.disabled}
        value={value}
        onChange={(selection: any) => props.onChange(selection.value)}
      >
        <div className="relative">
          <div className="flex">
            <Combobox.Input
              className="cui-input-base pr-16 truncate"
              placeholder={props.placeholder || "Select"}
              displayValue={(value: any) => value?.label}
              onChange={(event) => setQuery(event.target.value.toLowerCase())}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <div className="absolute top-1 right-0 flex items-center mr-2 text-lg text-gray-900">
                {props.isLoading ? (
                  <CareIcon className="care-l-spinner animate-spin" />
                ) : (
                  <CareIcon className="care-l-angle-down -mb-1.5" />
                )}
              </div>
            </Combobox.Button>
          </div>

          <DropdownTransition>
            <Combobox.Options className="origin-top-right absolute z-10 mt-0.5 cui-dropdown-base">
              {filteredOptions.map((option, index) => (
                <Combobox.Option
                  id={`${props.id}-option-${option.value}`}
                  key={index}
                  className={dropdownOptionClassNames}
                  value={option}
                >
                  <div className="flex justify-between">
                    {option.label}
                    {option.icon}
                  </div>
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </DropdownTransition>
        </div>
      </Combobox>
    </div>
  );
};
