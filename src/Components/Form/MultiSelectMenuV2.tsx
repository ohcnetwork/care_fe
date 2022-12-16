import React from "react";
import { Listbox } from "@headlessui/react";
import { DropdownTransition } from "../Common/components/HelperComponents";
import CareIcon from "../../CAREUI/icons/CareIcon";

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
        <div className="px-2 bg-secondary-100 rounded-full text-xs text-secondary-900 border border-secondary-400">
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
      <span className="text-secondary-700">{`${selectedOptions.length} items selected`}</span>
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
            <Listbox.Label className="sr-only">
              {props.placeholder}
            </Listbox.Label>
            <div className="relative">
              <div className="">
                <Listbox.Button className="w-full flex rounded bg-white disabled:bg-secondary-100 border border-secondary-300 focus:border-primary-400 outline-none ring-0 focus:ring-1 ring-primary-400 transition-all duration-200 ease-in-out">
                  <div className="relative z-0 flex items-center w-full">
                    <div className="relative flex-1 flex items-center py-3 pl-3 pr-4 focus:z-10">
                      <p className="ml-2.5 text-sm font-normal text-gray-500">
                        <Placeholder />
                      </p>
                    </div>
                    <CareIcon className="-mb-0.5 mr-2 care-l-angle-down text-lg text-secondary-900" />
                  </div>
                </Listbox.Button>
                {selectedOptions.length !== 0 && (
                  <div className="p-2 flex flex-wrap gap-2">
                    {selectedOptions.map((option) => (
                      <span className="bg-secondary-100 border-secondary-200 text-secondary-600 rounded-full text-xs px-3 py-1.5">
                        {option.selectedLabel}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <DropdownTransition show={open}>
                <Listbox.Options className="top-12 absolute z-10 w-full rounded-md xl:rounded-lg shadow-lg overflow-auto max-h-96 bg-gray-100 divide-y divide-gray-300 ring-1 ring-gray-400 focus:outline-none">
                  {options.map((option, index) => (
                    <Listbox.Option
                      id={`${props.id}-option-${index}`}
                      key={index}
                      className={({ active }) =>
                        `cursor-default select-none relative p-4 text-sm transition-all duration-100 ease-in-out ${
                          active
                            ? "text-white bg-primary-500"
                            : "text-secondary-900"
                        }`
                      }
                      value={option}
                    >
                      {({ selected, active }) => (
                        <div className="flex flex-col">
                          <div className="flex justify-between">
                            <p
                              className={
                                selected ? "font-semibold" : "font-normal"
                              }
                            >
                              {option.label}
                            </p>
                            {(option.icon || option.isSelected) && (
                              <span
                                className={`transition-all duration-100 ease-in-out ${
                                  active ? "text-white" : "text-primary-500"
                                }`}
                              >
                                {option.isSelected ? (
                                  <i className="fa-solid fa-check" />
                                ) : (
                                  option.icon
                                )}
                              </span>
                            )}
                          </div>
                          {option.description && (
                            <p
                              className={`mt-2 ${
                                active
                                  ? "text-primary-200"
                                  : "text-secondary-500"
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
