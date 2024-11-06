import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ReactNode, useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { DropdownTransition } from "@/components/Common/HelperComponents";
import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";
import {
  MultiSelectOptionChip,
  dropdownOptionClassNames,
} from "@/components/Form/MultiSelectMenuV2";

import { useValueInjectionObserver } from "@/Utils/useValueInjectionObserver";
import { classNames } from "@/Utils/utils";

type OptionCallback<T, R> = (option: T) => R;

type AutocompleteMultiSelectFormFieldProps<T, V> = FormFieldBaseProps<V[]> & {
  placeholder?: string;
  options: readonly T[];
  optionLabel: OptionCallback<T, string>;
  optionValue?: OptionCallback<T, V>;
  optionDisabled?: OptionCallback<T, boolean>;
  onQuery?: (query: string) => void;
  dropdownIcon?: React.ReactNode | undefined;
  minQueryLength?: number;
  isLoading?: boolean;
  selectAll?: boolean;
};

const AutocompleteMultiSelectFormField = <T, V>(
  props: AutocompleteMultiSelectFormFieldProps<T, V>,
) => {
  const field = useFormFieldPropsResolver(props);
  return (
    <FormField field={field}>
      <AutocompleteMutliSelect
        {...props}
        {...field}
        value={field.value || []}
        onChange={field.handleChange}
      />
    </FormField>
  );
};

export default AutocompleteMultiSelectFormField;

type AutocompleteMutliSelectProps<T, V = T> = {
  id?: string;
  options: readonly T[];
  disabled?: boolean | undefined;
  value: V[];
  placeholder?: string;
  optionDescription?: OptionCallback<T, ReactNode>;
  optionLabel: OptionCallback<T, string>;
  optionValue?: OptionCallback<T, V>;
  optionDisabled?: OptionCallback<T, boolean>;
  className?: string;
  onChange: OptionCallback<V[], void>;
  onQuery?: (query: string) => void;
  isLoading?: boolean;
  selectAll?: boolean;
  error?: string;
  minQueryLength?: number;
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
  props: AutocompleteMutliSelectProps<T, V>,
) => {
  const [query, setQuery] = useState(""); // Ensure lower case
  const comboButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    query.length >= (props.minQueryLength || 1) &&
      props.onQuery &&
      props.onQuery(query);
  }, [query]);
  const handleSingleSelect = (o: any) => {
    if (o.option?.isSingleSelect === true && comboButtonRef.current) {
      comboButtonRef.current.click();
    }
  };
  const options = props.options.map((option) => {
    const label = props.optionLabel(option);
    return {
      option,
      label,
      description: props.optionDescription?.(option),
      search: label.toLowerCase(),
      value: (props.optionValue ? props.optionValue(option) : option) as V,
      disabled: props.optionDisabled?.(option),
    };
  });

  const value = options.filter((o) => props.value.includes(o.value));
  const filteredOptions = options.filter((o) => o.search.includes(query));

  const domValue = useValueInjectionObserver<V[]>({
    targetElement: menuRef.current,
    attribute: "data-cui-listbox-value",
  });

  useEffect(() => {
    if (props.value !== domValue && typeof domValue !== "undefined")
      props.onChange(domValue);
  }, [domValue]);

  return (
    <div
      className={props.className}
      id={props.id}
      ref={menuRef}
      data-cui-listbox
      data-cui-listbox-options={JSON.stringify(
        options.map((option) => [option.value, option.label?.toString()]),
      )}
      data-cui-listbox-value={JSON.stringify(props.value)}
    >
      <Combobox
        immediate
        disabled={props.disabled}
        value={value}
        multiple
        onChange={(selections) => {
          if (selections[selections.length - 1].value === ("select-all" as V)) {
            if (selections.length - 1 === options.length) {
              props.onChange([]);
            } else {
              props.onChange(options.map((o) => o.value));
            }
          } else {
            props.onChange(selections.map((o) => o.value));
          }
        }}
      >
        <div className="relative">
          <div className="flex">
            <ComboboxInput
              multiple
              className={classNames(
                "cui-input-base truncate pr-16",
                props.error && "border-danger-500",
              )}
              placeholder={
                value.length
                  ? `${value.length} item(s) selected`
                  : (props.placeholder ?? "Select")
              }
              onChange={(event) => setQuery(event.target.value.toLowerCase())}
              autoComplete="off"
            />
            {!props.disabled && (
              <ComboboxButton
                ref={comboButtonRef}
                className="absolute inset-y-0 right-0 flex items-center pr-2"
              >
                <div className="absolute right-0 top-1 mr-2 flex items-center text-lg text-secondary-900">
                  {props.isLoading ? (
                    <CareIcon icon="l-spinner" className="animate-spin" />
                  ) : (
                    <CareIcon
                      id="dropdown-toggle"
                      icon="l-angle-down"
                      className="-mb-1.5"
                    />
                  )}
                </div>
              </ComboboxButton>
            )}
          </div>
          {value.length !== 0 && (
            <div className="flex flex-wrap gap-2 p-2">
              {value.map((v, i) => (
                <MultiSelectOptionChip
                  key={i}
                  label={v.label}
                  onRemove={() =>
                    props.onChange(
                      value.map((o) => o.value).filter((o) => o !== v.value),
                    )
                  }
                />
              ))}
            </div>
          )}

          <DropdownTransition>
            <ComboboxOptions
              modal={false}
              as="ul"
              className="cui-dropdown-base absolute top-12 z-10 mt-0.5"
            >
              {props.minQueryLength && query.length < props.minQueryLength ? (
                <div className="p-2 text-sm text-secondary-500">
                  {`Please enter at least ${props.minQueryLength} characters to search`}
                </div>
              ) : props.isLoading ? (
                <Searching />
              ) : filteredOptions.length ? (
                <>
                  {props.selectAll && (
                    <ComboboxOption
                      as="li"
                      id={`${props.id}-option-select-all`}
                      key={`${props.id}-option-select-all`}
                      className={dropdownOptionClassNames}
                      value={{ value: "select-all" }}
                    >
                      <div className="flex justify-between">
                        Select All
                        {value.length === filteredOptions.length && (
                          <CareIcon icon="l-check" className="text-lg" />
                        )}
                      </div>
                    </ComboboxOption>
                  )}
                  {filteredOptions.map((option, index) => (
                    <ComboboxOption
                      as="li"
                      id={`${props.id}-option-${index}`}
                      key={`${props.id}-option-${index}`}
                      className={dropdownOptionClassNames}
                      value={option}
                      onClick={() => {
                        handleSingleSelect(option);
                      }}
                      disabled={option.disabled}
                    >
                      {({ focus, selected }) => (
                        <>
                          <div className="flex justify-between">
                            {option.label}
                            {selected && (
                              <CareIcon icon="l-check" className="text-lg" />
                            )}
                          </div>
                          {option.description && (
                            <p
                              className={classNames(
                                "text-sm font-normal",
                                option.disabled
                                  ? "text-secondary-700"
                                  : focus
                                    ? "text-primary-200"
                                    : "text-secondary-700",
                              )}
                            >
                              {option.description}
                            </p>
                          )}
                        </>
                      )}
                    </ComboboxOption>
                  ))}
                </>
              ) : (
                <span className="flex items-center justify-center gap-2 py-6">
                  {!query && <CareIcon icon="l-search" className="text-lg" />}
                  {query ? "No results" : "Type to search"}
                </span>
              )}
            </ComboboxOptions>
          </DropdownTransition>
        </div>
      </Combobox>
    </div>
  );
};

const Searching = () => {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <CareIcon icon="l-spinner" className="animate-spin text-xl" />
      <span>Searching...</span>
    </div>
  );
};
