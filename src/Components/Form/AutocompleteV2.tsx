import React, { useState } from "react";
import { Combobox } from "@headlessui/react";
import { DropdownTransition } from "../Common/components/HelperComponents";
import CareIcon from "../../CAREUI/icons/CareIcon";

type OptionCallback<T, R> = (option: T) => R;

type AutocompleteProps<T, V = T> = {
  id?: string;
  options: T[];
  disabled?: boolean | undefined;
  value: V | undefined;
  placeholder?: string;
  optionLabel: OptionCallback<T, string>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  showIconWhenSelected?: boolean;
  className?: string;
  chevronIcon?: React.ReactNode | undefined;
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

export const AutocompleteV2 = <T, V>(props: AutocompleteProps<T, V>) => {
  const [query, setQuery] = useState(""); // Ensure lower case

  const valueOptions = props.options.map((option) => {
    const label = props.optionLabel(option);
    return {
      label,
      search: label.toLowerCase(),
      icon: props.optionIcon && props.optionIcon(option),
      value: props.optionValue ? props.optionValue(option) : option,
    };
  });

  const placeholder = props.placeholder ?? "Select";
  const defaultOption = {
    label: placeholder,
    selectedLabel: (
      <p className="font-normal text-secondary-400">{placeholder}</p>
    ),
    icon: undefined,
    value: undefined,
  };

  const options = props.required
    ? valueOptions
    : [defaultOption, ...valueOptions];

  const value = options.find((o) => props.value == o.value) || defaultOption;

  const filteredOptions = valueOptions.filter((o) => o.search.includes(query));

  return (
    <div className={props.className} id={props.id}>
      <Combobox
        disabled={props.disabled}
        value={value}
        onChange={(selection: any) => props.onChange(selection.value)}
      >
        <div className="relative">
          <div className="w-full py-1 flex rounded bg-white disabled:bg-secondary-100 border border-secondary-300 focus:border-primary-400 outline-none ring-0 focus:ring-1 ring-primary-400 transition-all duration-200 ease-in-out">
            <Combobox.Input
              className="w-full border-none text-sm leading-5 text-secondary-700 placeholder:text-secondary-400 font-medium placeholder:font-normal focus:ring-0 bg-inherit shadow-none pr-16 truncate"
              placeholder={placeholder}
              displayValue={props.optionLabel}
              onChange={(event) => setQuery(event.target.value.toLowerCase())}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <div className="absolute top-1 right-0 flex items-center mr-2 text-lg text-secondary-900">
                {props.chevronIcon || (
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
