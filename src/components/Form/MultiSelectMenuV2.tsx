import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ReactNode, useRef } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

type OptionCallback<T, R = void> = (option: T) => R;

type Props<T, V = T> = {
  id?: string;
  options: readonly T[];
  value: V[] | undefined;
  placeholder?: ReactNode;
  optionLabel: OptionCallback<T, ReactNode>;
  optionSelectedLabel?: OptionCallback<T, ReactNode>;
  optionDescription?: OptionCallback<T, ReactNode>;
  optionIcon?: OptionCallback<T, ReactNode>;
  optionValue?: OptionCallback<T, V>;
  optionDisabled?: OptionCallback<T, boolean>;
  className?: string;
  disabled?: boolean;
  renderSelectedOptions?: OptionCallback<T[], ReactNode>;
  onChange: OptionCallback<V[]>;
};

/**
 * Avoid using this component directly. Use `MultiSelectFormField` instead as
 * its API is easier to use and compliant with `FormField` based components.
 *
 * Use this only when you want to hack into the design and get more
 * customizability.
 */
const MultiSelectMenuV2 = <T, V>(props: Props<T, V>) => {
  const options = props.options.map((option) => {
    const label = props.optionLabel(option);
    const selectedLabel = props.optionSelectedLabel
      ? props.optionSelectedLabel(option)
      : label;

    const value = props.optionValue ? props.optionValue(option) : option;

    return {
      option,
      label,
      selectedLabel,
      description: props.optionDescription?.(option),
      icon: props.optionIcon?.(option),
      value,
      disabled: props.optionDisabled?.(option),
      isSelected: props.value?.includes(value as any) ?? false,
      displayChip: (
        <div className="rounded-full border border-secondary-400 bg-secondary-100 px-2 text-xs text-secondary-900">
          {selectedLabel}
        </div>
      ),
    };
  });

  const placeholder = props.placeholder ?? "Select";
  const selectedOptions = options.filter((o) => o.isSelected);

  const Placeholder: () => any = () => {
    if (selectedOptions.length === 0) return placeholder;
    if (props.renderSelectedOptions)
      return props.renderSelectedOptions(selectedOptions.map((o) => o.option));
  };

  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSingleSelect = (o: any) => {
    if (
      o.option?.isSingleSelect === true &&
      !selectedOptions.includes(o) &&
      buttonRef.current
    ) {
      buttonRef.current.click();
    }
  };

  return (
    <div className={props.className} id={props.id}>
      <Listbox
        disabled={props.disabled}
        value={selectedOptions}
        onChange={(opts: typeof options) =>
          props.onChange(opts.map((o) => o.value) as any)
        }
        multiple
      >
        <>
          <Label className="sr-only !relative">{props.placeholder}</Label>
          <div className="relative">
            <div>
              <ListboxButton
                className="cui-input-base flex w-full rounded"
                ref={buttonRef}
              >
                <div className="relative z-0 flex w-full items-center">
                  <div className="relative flex flex-1 items-center pr-4 focus:z-10">
                    <p className="ml-2.5 text-sm font-normal text-secondary-600">
                      <Placeholder />
                    </p>

                    {selectedOptions.length !== 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedOptions.map((option, index) => (
                          <MultiSelectOptionChip
                            key={index}
                            label={option.selectedLabel}
                            onRemove={() => {
                              const updatedOptions = selectedOptions.filter(
                                (selectedOption) =>
                                  selectedOption.value !== option.value,
                              );
                              props.onChange(
                                updatedOptions.map((o) => o.value) as any,
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <CareIcon
                    id="dropdown-toggle"
                    icon="l-angle-down"
                    className="-mb-0.5 text-lg text-secondary-900"
                  />
                </div>
              </ListboxButton>
            </div>
            <ListboxOptions
              modal={false}
              as="ul"
              className="cui-dropdown-base absolute top-full"
            >
              {options.map((option, index) => (
                <ListboxOption
                  as="li"
                  id={`${props.id}-option-${index}`}
                  key={index}
                  className={dropdownOptionClassNames}
                  value={option}
                  onClick={() => handleSingleSelect(option)}
                  disabled={option.disabled}
                >
                  {({ focus }) => (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        {option.label}
                        {(option.icon || option.isSelected) &&
                          (option.isSelected ? (
                            <CareIcon icon="l-check" className="text-lg" />
                          ) : (
                            option.icon
                          ))}
                      </div>
                      {option.description && (
                        <p
                          className={classNames(
                            "text-sm font-normal",
                            option.disabled
                              ? "text-secondary-500"
                              : focus
                                ? "text-primary-200"
                                : "text-secondary-500",
                          )}
                        >
                          {option.description}
                        </p>
                      )}
                    </div>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </>
      </Listbox>
    </div>
  );
};

export default MultiSelectMenuV2;

interface MultiSelectOptionChipProps {
  label: ReactNode;
  onRemove?: () => void;
}

export const MultiSelectOptionChip = ({
  label,
  onRemove,
}: MultiSelectOptionChipProps) => {
  return (
    <span className="flex items-center gap-2 rounded-full border-secondary-300 bg-secondary-200 px-3 text-xs text-secondary-700">
      <p className="py-1">{label}</p>
      {onRemove && (
        <p
          className="cursor-pointer rounded-full hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <CareIcon icon="l-times" className="text-base" />
        </p>
      )}
    </span>
  );
};

interface OptionRenderPropArg {
  focus: boolean;
  selected: boolean;
  disabled: boolean;
}

export const dropdownOptionClassNames = ({
  focus,
  selected,
  disabled,
}: OptionRenderPropArg) => {
  return classNames(
    "group/option relative w-full cursor-default select-none p-4 text-sm transition-colors duration-75 ease-in-out",
    !disabled && focus && "bg-primary-500 text-white",
    !disabled && !focus && selected && "text-primary-500",
    !disabled && !focus && !selected && "text-secondary-900",
    disabled && "cursor-not-allowed text-secondary-600",
    selected ? "font-semibold" : "font-normal",
  );
};
