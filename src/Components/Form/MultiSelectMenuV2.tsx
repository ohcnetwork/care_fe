import CareIcon from "../../CAREUI/icons/CareIcon";
import { DropdownTransition } from "../Common/components/HelperComponents";
import { Listbox } from "@headlessui/react";
import { classNames } from "../../Utils/utils";
import { ReactNode } from "react";

type OptionCallback<T, R = void> = (option: T) => R;

type Props<T, V = T> = {
  id?: string;
  options: T[];
  value: V[] | undefined;
  placeholder?: ReactNode;
  optionLabel: OptionCallback<T, ReactNode>;
  optionSelectedLabel?: OptionCallback<T, ReactNode>;
  optionDescription?: OptionCallback<T, ReactNode>;
  optionIcon?: OptionCallback<T, ReactNode>;
  optionValue?: OptionCallback<T, V>;
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
      description: props.optionDescription && props.optionDescription(option),
      icon: props.optionIcon && props.optionIcon(option),
      value,
      isSelected: props.value?.includes(value as any) ?? false,
      displayChip: (
        <div className="rounded-full border border-secondary-400 bg-secondary-100 px-2 text-xs text-gray-900">
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
                <Listbox.Button className="cui-input-base flex w-full rounded">
                  <div className="relative z-0 flex w-full items-center">
                    <div className="relative flex flex-1 items-center pr-4 focus:z-10">
                      <p className="ml-2.5 text-sm font-normal text-gray-600">
                        <Placeholder />
                      </p>
                    </div>
                    <CareIcon className="care-l-angle-down -mb-0.5 text-lg text-gray-900" />
                  </div>
                </Listbox.Button>
                {selectedOptions.length !== 0 && (
                  <div className="flex flex-wrap gap-2 p-2">
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
  label: ReactNode;
  onRemove?: () => void;
}

export const MultiSelectOptionChip = (props: MultiSelectOptionChipProps) => {
  return (
    <span className="flex items-center gap-2 rounded-full border-gray-300 bg-gray-200 px-3 text-xs text-gray-700">
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
    "group/option relative w-full cursor-default select-none p-4 text-sm transition-colors duration-75 ease-in-out",
    active && "bg-primary-500 text-white",
    !active && selected && "text-primary-500",
    !active && !selected && "text-gray-900",
    selected ? "font-semibold" : "font-normal"
  );
};
