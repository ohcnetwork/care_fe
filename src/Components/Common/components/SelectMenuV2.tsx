import React, { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";

type OptionCallback<T, R> = (option: T) => R;

type SelectMenuProps<T> = {
  id?: string;
  options: T[];
  value?: T;
  placeholder?: React.ReactNode;
  optionLabel: OptionCallback<T, React.ReactNode>;
  optionSelectedLabel?: OptionCallback<T, React.ReactNode>;
  optionDescription?: OptionCallback<T, React.ReactNode>;
  optionIcon?: OptionCallback<T, React.ReactNode>;
  className?: string;
} & (
  | {
      required?: false;
      onChange: OptionCallback<T | undefined, void>;
    }
  | {
      required: true;
      onChange: OptionCallback<T, void>;
    }
);

const SelectMenuV2 = <T,>(props: SelectMenuProps<T>) => {
  const valueOptions = props.options.map((option) => {
    return {
      label: props.optionLabel(option),
      selectedLabel: props.optionSelectedLabel
        ? props.optionSelectedLabel(option)
        : props.optionLabel(option),
      description: props.optionDescription && props.optionDescription(option),
      icon: props.optionIcon && props.optionIcon(option),
      value: option,
    };
  });

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

  return (
    <div className={props.className}>
      <Listbox
        value={options.find((o) => props.value === o.value)}
        onChange={(selection: any) => props.onChange(selection.value)}
      >
        {({ open, value }) => {
          console.log(value);
          return (
            <>
              <Listbox.Label className="sr-only">
                {props.placeholder}
              </Listbox.Label>
              <div className="relative">
                <Listbox.Button className="w-full flex rounded bg-gray-200 ring-0 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ease-in-out">
                  <div className="relative z-0 flex items-center w-full">
                    <div className="relative flex-1 flex items-center py-3 pl-3 pr-4 focus:z-10">
                      <div className="ml-2 text-sm text-gray-700">
                        {value.icon}
                      </div>
                      <p className="ml-2.5 text-sm font-medium">
                        {value.selectedLabel}
                      </p>
                    </div>
                    <i className="p-2 mr-2 text-sm fa-solid fa-chevron-down" />
                  </div>
                </Listbox.Button>
                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-200"
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="origin-top-right absolute z-10 mt-2 w-full rounded-md xl:rounded-lg shadow-lg overflow-auto max-h-96 bg-gray-100 divide-y divide-gray-300 ring-1 ring-gray-400 focus:outline-none">
                    {options.map((option, index) => (
                      <Listbox.Option
                        id={`${props.id}-option-${option.value}`}
                        key={index}
                        className={({ active }) =>
                          `cursor-default select-none relative p-4 text-sm transition-all duration-100 ease-in-out ${
                            active
                              ? "text-white bg-primary-500"
                              : "text-gray-900"
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
                              {option.icon && (
                                <span
                                  className={`transition-all duration-100 ease-in-out ${
                                    active ? "text-white" : "text-primary-500"
                                  }`}
                                >
                                  {option.icon}
                                </span>
                              )}
                            </div>
                            {option.description && (
                              <p
                                className={`mt-2 ${
                                  active ? "text-primary-200" : "text-gray-500"
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
                </Transition>
              </div>
            </>
          );
        }}
      </Listbox>
    </div>
  );
};

export default SelectMenuV2;
