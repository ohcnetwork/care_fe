import React, { useEffect, useState } from "react";
import { Combobox } from "@headlessui/react";
import { DropdownTransition } from "../../Common/components/HelperComponents";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "./Utils";
import FormField from "./FormField";
import {
  dropdownOptionClassNames,
  MultiSelectOptionChip,
} from "../MultiSelectMenuV2";

type OptionCallback<T, R> = (option: T) => R;

type AutocompleteMultiSelectFormFieldProps<T, V> = FormFieldBaseProps<V[]> & {
  placeholder?: string;
  options: T[];
  optionLabel: OptionCallback<T, string>;
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
  optionValue?: OptionCallback<T, V>;
  className?: string;
  onChange: OptionCallback<V[], void>;
  dropdownIcon?: React.ReactNode | undefined;
  onQuery?: (query: string) => void;
};

/**
 * Avoid using this component directly. Use `AutocompleteMultiSelectFormField`
 * instead as its API is easier to use and compliant with `FormField` based
 * components.
 *
 * Use this only when you want to hack into the design and get more
 * customizability.
 */
export const AutocompleteMutliSelect = <T, V>(
  props: AutocompleteMutliSelectProps<T, V>
) => {
  const [query, setQuery] = useState(""); // Ensure lower case
  useEffect(() => {
    props.onQuery && props.onQuery(query);
  }, [query]);

  const options = props.options.map((option) => {
    const label = props.optionLabel(option);
    return {
      label,
      search: label.toLowerCase(),
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
          <div className="flex">
            <Combobox.Input
              multiple
              className="cui-input-base pr-16 truncate"
              placeholder={
                value.length
                  ? `${value.length} item(s) selected`
                  : props.placeholder || "Select"
              }
              onChange={(event) => setQuery(event.target.value.toLowerCase())}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <div className="absolute top-1 right-0 flex items-center mr-2 text-lg text-gray-900">
                {props.dropdownIcon || (
                  <CareIcon className="care-l-angle-down -mb-1.5" />
                )}
              </div>
            </Combobox.Button>
          </div>
          {value.length !== 0 && (
            <div className="p-2 flex flex-wrap gap-2">
              {value.map((v) => (
                <MultiSelectOptionChip
                  label={v.label}
                  onRemove={() =>
                    props.onChange(
                      value.map((o) => o.value).filter((o) => o !== v.value)
                    )
                  }
                />
              ))}
            </div>
          )}

          <DropdownTransition>
            <Combobox.Options className="top-12 absolute z-10 mt-0.5 w-full rounded-md xl:rounded-lg shadow-lg overflow-auto max-h-96 bg-gray-100 divide-y divide-gray-300 ring-1 ring-gray-400 focus:outline-none">
              {filteredOptions.map((option, index) => (
                <Combobox.Option
                  id={`${props.id}-option-${option.value}`}
                  key={index}
                  className={dropdownOptionClassNames}
                  value={option}
                >
                  {({ selected }) => (
                    <div className="flex flex-col">
                      <div className="flex justify-between">
                        <p>{option.label}</p>
                        {selected && (
                          <CareIcon className="care-l-check text-lg" />
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
