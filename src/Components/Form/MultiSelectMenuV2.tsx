import React from "react";
import { Listbox } from "@headlessui/react";
import { DropdownTransition } from "../Common/components/HelperComponents";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";

type OptionCallback<T, R = void> = (option: T) => R;

type Props<T, V = T> = {
  id?: string;
  options: T[];
  value: V[] | undefined;
  placeholder?: React.ReactNode;
  optionLabel: OptionCallback<T, React.ReactNode>;
  optionSelectedLabel?: OptionCallback<T, React.ReactNode>;
  optionDescription?: OptionCallback<T, React.ReactNode>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  optionValue?: OptionCallback<T, V>;
  className?: string;
  disabled?: boolean;
  renderSelectedOptions?: OptionCallback<T[], React.ReactNode>;
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
      description: props.optionDescription && props.optionDescription(option),
      icon: props.optionIcon && props.optionIcon(option),
      value,
      isSelected: props.value?.includes(value as any) ?? false,
      displayChip: (
        <div className="px-2 bg-secondary-100 rounded-full text-xs text-gray-900 border border-secondary-400">
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
    return (
      <span className="text-gray-800">{`${selectedOptions.length} item(s) selected`}</span>
    );
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
        {({ open }) => (
          <>
            <Listbox.Label className="sr-only !relative">
              {props.placeholder}
            </Listbox.Label>
            <div className="relative">
              <div>
                <Listbox.Button className="cui-input-base w-full flex rounded">
                  <div className="relative z-0 flex items-center w-full">
                    <div className="relative flex-1 flex items-center pr-4 focus:z-10">
                      <p className="ml-2.5 text-sm font-normal text-gray-600">
                        <Placeholder />
                      </p>
                    </div>
                    <CareIcon className="-mb-0.5 care-l-angle-down text-lg text-gray-900" />
                  </div>
                </Listbox.Button>
                {selectedOptions.length !== 0 && (
                  <div className="p-2 flex flex-wrap gap-2">
                    {selectedOptions.map((option) => (
                      <MultiSelectOptionChip label={option.selectedLabel} />
                    ))}
                  </div>
                )}
              </div>
              <DropdownTransition show={open}>
                <Listbox.Options className="cui-dropdown-base absolute top-12">
                  {options.map((option, index) => (
                    <Listbox.Option
                      id={`${props.id}-option-${index}`}
                      key={index}
                      className={dropdownOptionClassNames}
                      value={option}
                    >
                      {({ active }) => (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between">
                            {option.label}
                            {(option.icon || option.isSelected) &&
                              (option.isSelected ? (
                                <CareIcon className="care-l-check text-lg" />
                              ) : (
                                option.icon
                              ))}
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
          </>
        )}
      </Listbox>
    </div>
  );
};

export default MultiSelectMenuV2;

interface MultiSelectOptionChipProps {
  label: React.ReactNode;
  onRemove?: () => void;
}

export const MultiSelectOptionChip = (props: MultiSelectOptionChipProps) => {
  return (
    <span className="flex gap-2 items-center bg-gray-200 border-gray-300 text-gray-700 rounded-full text-xs px-3">
      <p className="py-1.5">{props.label}</p>
      {props.onRemove && (
        <p
          className="cursor-pointer rounded-full hover:bg-white"
          onClick={props.onRemove}
        >
          <CareIcon className="care-l-times text-base" />
        </p>
      )}
    </span>
  );
};

interface OptionRenderPropArg {
  active: boolean;
  selected: boolean;
}

export const dropdownOptionClassNames = ({
  active,
  selected,
}: OptionRenderPropArg) => {
  return classNames(
    "cursor-default select-none relative p-4 text-sm",
    active && "text-white bg-primary-500",
    !active && selected && "text-primary-500",
    !active && !selected && "text-gray-900",
    selected ? "font-semibold" : "font-normal"
  );
};
