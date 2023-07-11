import React, { useEffect, useState } from "react";
import { Combobox } from "@headlessui/react";
import { DropdownTransition } from "../../Common/components/HelperComponents";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { dropdownOptionClassNames } from "../MultiSelectMenuV2";
import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import FormField from "./FormField";
import { classNames } from "../../../Utils/utils";

type OptionCallback<T, R> = (option: T) => R;

type AutocompleteFormFieldProps<T, V> = FormFieldBaseProps<V> & {
  placeholder?: string;
  options: T[];
  optionLabel: OptionCallback<T, string>;
  optionValue?: OptionCallback<T, V>;
  optionDescription?: OptionCallback<T, string>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  onQuery?: (query: string) => void;
  dropdownIcon?: React.ReactNode | undefined;
  isLoading?: boolean;
  allowRawInput?: boolean;
  error?: string;
};

const AutocompleteFormField = <T, V>(
  props: AutocompleteFormFieldProps<T, V>
) => {
  const field = useFormFieldPropsResolver(props);
  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled}
        required={field.required}
        className={field.className}
        value={field.value}
        onChange={(value: any) => field.handleChange(value)}
        options={props.options}
        placeholder={props.placeholder}
        optionLabel={props.optionLabel}
        optionIcon={props.optionIcon}
        optionValue={props.optionValue}
        optionDescription={props.optionDescription}
        onQuery={props.onQuery}
        isLoading={props.isLoading}
        allowRawInput={props.allowRawInput}
        error={field.error}
        requiredError={field.error ? props.required : false}
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
  optionDescription?: OptionCallback<T, React.ReactNode>;
  className?: string;
  onQuery?: (query: string) => void;
  requiredError?: boolean;
  isLoading?: boolean;
  allowRawInput?: boolean;
  error?: string;
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
    props.onQuery?.(query);
  }, [query]);

  const mappedOptions = props.options.map((option) => {
    const label = props.optionLabel(option);
    const description = props.optionDescription?.(option);
    return {
      label,
      description,
      search: label.toLowerCase(),
      icon: props.optionIcon?.(option),
      value: props.optionValue ? props.optionValue(option) : option,
    };
  });

  const getOptions = () => {
    if (!query) return mappedOptions;

    const knownOption = mappedOptions.find(
      (o) => o.value == props.value || o.label == props.value
    );

    if (knownOption) return mappedOptions;
    return [
      {
        label: query,
        description: undefined,
        search: query.toLowerCase(),
        icon: <CareIcon className="care-l-plus" />,
        value: query,
      },
      ...mappedOptions,
    ];
  };

  const options = props.allowRawInput ? getOptions() : mappedOptions;

  const value = options.find((o) => props.value == o.value);
  const filteredOptions =
    props.onQuery === undefined
      ? options.filter((o) => o.search.includes(query))
      : options;

  return (
    <div
      className={
        props.requiredError || props.error
          ? "border rounded border-red-500 " + props.className
          : props.className
      }
      id={props.id}
    >
      <Combobox
        disabled={props.disabled}
        value={value ?? props.placeholder ?? "Select"}
        onChange={(selection: any) => props.onChange(selection.value)}
      >
        <div className="relative">
          <div className="flex">
            <Combobox.Input
              className="cui-input-base pr-16 truncate"
              placeholder={props.placeholder ?? "Select"}
              displayValue={(value: any) => value?.label || ""}
              onChange={(event) => setQuery(event.target.value.toLowerCase())}
              autoComplete="off"
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <div className="pb-2 absolute h-full top-1 right-0 flex gap-1 items-center mr-2 text-lg text-gray-900">
                <span>{value?.icon}</span>
                {props.isLoading ? (
                  <CareIcon className="care-l-spinner animate-spin" />
                ) : (
                  <CareIcon className="care-l-angle-down" />
                )}
              </div>
              {value && (
                <div
                  className="pb-2 absolute h-full top-1 right-0 flex gap-1 items-center mr-7 text-lg text-gray-900 hover:text-gray-500"
                  onClick={() => {
                    if (!props.required) props.onChange(undefined);
                  }}
                >
                  {!props.isLoading && (
                    <CareIcon className="w-4 h-4 care-l-times-circle" />
                  )}
                </div>
              )}
            </Combobox.Button>
          </div>

          <DropdownTransition>
            <Combobox.Options className="origin-top-right absolute z-10 mt-0.5 cui-dropdown-base">
              {filteredOptions.length === 0 && (
                <div className="p-2 text-sm text-gray-500">
                  No options found
                </div>
              )}
              {filteredOptions.map((option, index) => (
                <Combobox.Option
                  id={`${props.id}-option-${option.value}`}
                  key={index}
                  className={dropdownOptionClassNames}
                  value={option}
                >
                  {({ active }) => (
                    <div className="flex flex-col">
                      <div className="flex justify-between">
                        <span>{option.label}</span>
                        <span>{option.icon}</span>
                      </div>
                      {option.description && (
                        <div
                          className={classNames(
                            "text-sm",
                            active ? "text-primary-200" : "text-gray-700"
                          )}
                        >
                          {option.description}
                        </div>
                      )}
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
