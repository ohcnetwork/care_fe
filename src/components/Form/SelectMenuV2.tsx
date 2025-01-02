import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ReactNode, useEffect, useRef } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { dropdownOptionClassNames } from "@/components/Form/MultiSelectMenuV2";

import { useValueInjectionObserver } from "@/Utils/useValueInjectionObserver";
import { classNames } from "@/Utils/utils";

type OptionCallback<T, R> = (option: T) => R;

type SelectMenuProps<T, V = T> = {
  id?: string;
  options: readonly T[];
  disabled?: boolean | undefined;
  value: V | undefined;
  placeholder?: ReactNode;
  position?: "above" | "below";
  optionLabel: OptionCallback<T, ReactNode>;
  optionSelectedLabel?: OptionCallback<T, ReactNode>;
  optionDescription?: OptionCallback<T, ReactNode>;
  optionIcon?: OptionCallback<T, ReactNode>;
  optionValue?: OptionCallback<T, V>;
  optionDisabled?: OptionCallback<T, boolean>;
  showIconWhenSelected?: boolean;
  showChevronIcon?: boolean;
  className?: string;
  inputClassName?: string;
  requiredError?: boolean;
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
  const menuRef = useRef<HTMLDivElement>(null);

  const valueOptions = props.options.map((option) => {
    const label = props.optionLabel(option);
    return {
      label,
      selectedLabel: props.optionSelectedLabel
        ? props.optionSelectedLabel(option)
        : label,
      description: props.optionDescription?.(option),
      icon: props.optionIcon?.(option),
      value: props.optionValue ? props.optionValue(option) : option,
      disabled: props.optionDisabled?.(option),
    };
  });

  const showChevronIcon = props.showChevronIcon ?? true;

  const placeholder =
    valueOptions?.length > 0 ? (props.placeholder ?? "Select") : "No options";
  const defaultOption = {
    label: placeholder,
    selectedLabel: (
      <span className="font-normal text-secondary-600">{placeholder}</span>
    ),
    description: undefined,
    icon: undefined,
    value: undefined,
    disabled: undefined,
  };

  const options = props.required
    ? valueOptions
    : [defaultOption, ...valueOptions];

  const value = options.find((o) => props.value == o.value) ?? defaultOption;

  const domValue = useValueInjectionObserver<V>({
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
      ref={menuRef}
      id={props.id}
      data-cui-listbox
      data-cui-listbox-options={JSON.stringify(
        options.map((option) => [option.value, option.label?.toString()]),
      )}
      data-cui-listbox-value={JSON.stringify(props.value)}
    >
      <Listbox
        disabled={props.disabled || valueOptions?.length === 0}
        value={value}
        onChange={(selection: any) => props.onChange(selection.value)}
      >
        <>
          <Label className="sr-only !relative">{props.placeholder}</Label>
          <div className="relative">
            <ListboxButton
              className={classNames(
                "cui-input-base flex w-full rounded",
                props?.requiredError && "border-red-500",
                props.inputClassName,
              )}
              onFocus={props.onFocus}
              onBlur={props.onBlur}
            >
              <div className="relative z-0 flex w-full items-center">
                <div className="relative flex flex-1 items-center focus:z-10">
                  {props.showIconWhenSelected && value?.icon && (
                    <div className="ml-2 text-sm text-secondary-700">
                      {value.icon}
                    </div>
                  )}
                  <p className="ml-2.5 whitespace-pre-wrap text-start text-sm font-medium">
                    {value.selectedLabel}
                  </p>
                </div>
                {showChevronIcon && (
                  <CareIcon
                    id="dropdown-toggle"
                    icon="l-angle-down"
                    className="-mb-0.5 text-lg text-secondary-900"
                  />
                )}
              </div>
            </ListboxButton>
            <div
              className={classNames(
                "absolute z-10 w-full",
                props.position === "above" ? "bottom-0 mb-12" : "top-0 mt-12",
              )}
            >
              <ListboxOptions
                modal={false}
                as="ul"
                className="cui-dropdown-base"
              >
                {options.map((option, index) => (
                  <ListboxOption
                    as="li"
                    id={`${props.id}-option-${option.value}`}
                    key={index}
                    className={dropdownOptionClassNames}
                    value={option}
                    disabled={option.disabled}
                  >
                    {({ focus, selected }) => (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                          {option.label}
                          {props.optionIcon
                            ? option.icon
                            : selected && (
                                <CareIcon icon="l-check" className="text-lg" />
                              )}
                        </div>
                        {option.description && (
                          <span
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
                          </span>
                        )}
                      </div>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </div>
        </>
      </Listbox>
    </div>
  );
};

export default SelectMenuV2;
