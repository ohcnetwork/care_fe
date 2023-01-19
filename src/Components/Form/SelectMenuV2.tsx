import React from "react";
import { Listbox } from "@headlessui/react";
import { DropdownTransition } from "../Common/components/HelperComponents";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { dropdownOptionClassNames } from "./MultiSelectMenuV2";
import { classNames } from "../../Utils/utils";

type OptionCallback<T, R> = (option: T) => R;

type SelectMenuProps<T, V = T> = {
  id?: string;
  options: T[];
  disabled?: boolean | undefined;
  value: V | undefined;
  placeholder?: React.ReactNode;
  position?: "above" | "below";
  optionLabel: OptionCallback<T, React.ReactNode>;
  optionSelectedLabel?: OptionCallback<T, React.ReactNode>;
  optionDescription?: OptionCallback<T, React.ReactNode>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  showIconWhenSelected?: boolean;
  showChevronIcon?: boolean;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
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
 * Avoid using this component directly. Use `SelectFormField` instead as its API
 * is easier to use and compliant with `FormField` based components.
 *
 * Use this only when you want to hack into the design and get more
 * customizability.
 */
const SelectMenuV2 = <T, V>(props: SelectMenuProps<T, V>) => {
  const valueOptions = props.options.map((option) => {
    const label = props.optionLabel(option);
    return {
      label,
      selectedLabel: props.optionSelectedLabel
        ? props.optionSelectedLabel(option)
        : label,
      description: props.optionDescription && props.optionDescription(option),
      icon: props.optionIcon && props.optionIcon(option),
      value: props.optionValue ? props.optionValue(option) : option,
    };
  });

  const showChevronIcon = props.showChevronIcon ?? true;

  const placeholder = props.placeholder || "Select";
  const defaultOption = {
    label: placeholder,
    selectedLabel: <p className="font-normal text-gray-600">{placeholder}</p>,
    description: undefined,
    icon: undefined,
    value: undefined,
  };

  const options = props.required
    ? valueOptions
    : [defaultOption, ...valueOptions];

  const value = options.find((o) => props.value == o.value) || defaultOption;

  return (
    <div className={props.className} id={props.id}>
      <Listbox
        disabled={props.disabled}
        value={value}
        onChange={(selection: any) => props.onChange(selection.value)}
      >
        {({ open }) => (
          <>
            <Listbox.Label className="sr-only !relative">
              {props.placeholder}
            </Listbox.Label>
            <div className="relative">
              <Listbox.Button
                className="w-full flex rounded cui-input-base"
                onFocus={props.onFocus}
                onBlur={props.onBlur}
              >
                <div className="relative z-0 flex items-center w-full">
                  <div className="relative flex-1 flex items-center focus:z-10">
                    {props.showIconWhenSelected && value?.icon && (
                      <div className="ml-2 text-sm text-gray-700">
                        {value.icon}
                      </div>
                    )}
                    <p className="ml-2.5 text-sm font-medium">
                      {value.selectedLabel}
                    </p>
                  </div>
                  {showChevronIcon && (
                    <CareIcon className="-mb-0.5 care-l-angle-down text-lg text-gray-900" />
                  )}
                </div>
              </Listbox.Button>
              <div
                className={classNames(
                  "absolute w-full z-10",
                  props.position === "above" ? "bottom-0 mb-12" : "top-0 mt-12"
                )}
              >
                <DropdownTransition show={open}>
                  <Listbox.Options className="cui-dropdown-base">
                    {options.map((option, index) => (
                      <Listbox.Option
                        id={`${props.id}-option-${option.value}`}
                        key={index}
                        className={dropdownOptionClassNames}
                        value={option}
                      >
                        {({ active, selected }) => (
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                              {option.label}
                              {props.optionIcon
                                ? option.icon
                                : selected && (
                                    <CareIcon className="care-l-check text-lg" />
                                  )}
                            </div>
                            {option.description && (
                              <p
                                className={`font-normal ${
                                  active ? "text-primary-200" : "text-gray-700"
                                }`}
                              >
                                {option.description}
                              </p>
                            )}
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </DropdownTransition>
              </div>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
};

export default SelectMenuV2;
