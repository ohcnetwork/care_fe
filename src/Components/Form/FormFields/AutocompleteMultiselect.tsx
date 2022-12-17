import React, { useState } from "react";
import { Combobox } from "@headlessui/react";
import { DropdownTransition } from "../../Common/components/HelperComponents";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "./Utils";
import FormField from "./FormField";
import { useEffect } from "@storybook/addons";

type OptionCallback<T, R> = (option: T) => R;

type AutocompleteMultiSelectFormFieldProps<T, V> = FormFieldBaseProps<V[]> & {
  placeholder?: string;
  options: T[];
  optionLabel: OptionCallback<T, string>;
  optionIcon?: OptionCallback<T, string>;
  optionValue?: OptionCallback<T, V>;
  onQuery?: (query: string) => void;
  dropdownIcon?: React.ReactNode | undefined;
};

const AutocompleteMultiSelectFormField = <T, V>(
  props: AutocompleteMultiSelectFormFieldProps<T, V>
) => {
  const { name } = props;
  const handleChange = resolveFormFieldChangeEventHandler(props);

  return (
    <FormField props={props}>
      <AutocompleteMutliSelect
        {...props}
        value={props.value || []}
        onChange={(value) => handleChange({ name, value })}
      />
    </FormField>
  );
};

export default AutocompleteMultiSelectFormField;

type AutocompleteMutliSelectProps<T, V = T> = {
  id?: string;
  options: T[];
  disabled?: boolean | undefined;
  value: V[];
  placeholder?: string;
  optionLabel: OptionCallback<T, string>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  className?: string;
  onChange: OptionCallback<V[], void>;
  dropdownIcon?: React.ReactNode | undefined;
  onQuery?: (query: string) => void;
};

/**
 * Do not use this component directly! Use `AutocompleteMultiSelectFormField`
 * instead as it API is easier to use and compliant with `FormField` based
 * components.
 */
export const AutocompleteMutliSelect = <T, V>(
  props: AutocompleteMutliSelectProps<T, V>
) => {
  const [query, setQuery] = useState(""); // Ensure lower case
  useEffect(() => props.onQuery && props.onQuery(query), [query]);

  const options = props.options.map((option) => {
    const label = props.optionLabel(option);
    return {
      label,
      search: label.toLowerCase(),
      icon: props.optionIcon && props.optionIcon(option),
      value: (props.optionValue ? props.optionValue(option) : option) as V,
    };
  });

  const value = options.filter((o) => props.value.includes(o.value));
  const filteredOptions = options.filter((o) => o.search.includes(query));

  return (
    <div className={props.className} id={props.id}>
      <Combobox
        disabled={props.disabled}
        value={value}
        multiple
        onChange={(selection) => props.onChange(selection.map((o) => o.value))}
      >
        <div className="relative">
          <div className="w-full py-1 flex rounded bg-white disabled:bg-secondary-100 border border-secondary-300 focus:border-primary-400 outline-none ring-0 focus:ring-1 ring-primary-400 transition-all duration-200 ease-in-out">
            <Combobox.Input
              className="w-full border-none text-sm leading-5 text-secondary-700 placeholder:text-secondary-400 font-medium placeholder:font-normal focus:ring-0 bg-inherit shadow-none pr-16 truncate"
              placeholder={props.placeholder || "Select"}
              displayValue={props.optionLabel}
              onChange={(event) => setQuery(event.target.value.toLowerCase())}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <div className="absolute top-1 right-0 flex items-center mr-2 text-lg text-secondary-900">
                {props.dropdownIcon || (
                  <CareIcon className="care-l-angle-down -mb-1.5" />
                )}
              </div>
            </Combobox.Button>
          </div>

          <DropdownTransition>
            <Combobox.Options className="origin-top-right absolute z-10 mt-0.5 w-full rounded-md xl:rounded-lg shadow-lg overflow-auto max-h-96 bg-gray-100 divide-y divide-gray-300 ring-1 ring-gray-400 focus:outline-none">
              {filteredOptions.map((option, index) => (
                <Combobox.Option
                  id={`${props.id}-option-${option.value}`}
                  key={index}
                  className={({ active }) =>
                    `cursor-default select-none relative p-4 text-sm transition-all duration-100 ease-in-out ${
                      active ? "text-white bg-primary-500" : "text-gray-900"
                    }`
                  }
                  value={option}
                >
                  {({ selected, active }) => (
                    <div className="flex flex-col">
                      <div className="flex justify-between">
                        <p className={selected ? "font-semibold" : ""}>
                          {option.label}
                        </p>
                        {option.icon && (
                          <div
                            className={`transition-all duration-100 ease-in-out ${
                              active ? "text-white" : "text-primary-500"
                            }`}
                          >
                            {option.icon}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </DropdownTransition>
        </div>
      </Combobox>
    </div>
  );
};
