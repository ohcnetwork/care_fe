import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Check, KeyboardArrowDown } from "@material-ui/icons";

type Props<T> = {
  options: {
    title: string;
    description?: string;
    value: T;
  }[];
  onSelect: (value: T) => void;
  selected?: T;
  label?: string;
  position?: string;
};

export default function SelectMenuV2<T>(props: Props<T>) {
  const options = props.options.map((option) => {
    return {
      ...option,
      current: option.value === props.selected,
    };
  });

  const selected = options.find((option) => option.current) || options[0];

  return (
    <Listbox
      value={selected}
      onChange={(selection) => {
        props.onSelect(selection.value);
      }}
    >
      {({ open }) => (
        <>
          <Listbox.Label className="sr-only">{props.label}</Listbox.Label>
          <div className="relative">
            <Listbox.Button className="inline-flex shadow-sm rounded bg-gray-50 hover:bg-gray-200 focus:ring-primary-500 border focus:ring-1 ring-gray-400 focus:border-primary-500 border-gray-400 transition-all duration-200 ease-in-out">
              <div className="relative z-0 inline-flex">
                <div className="relative inline-flex items-center py-2 pl-3 pr-4 border border-transparent rounded-l focus:outline-none focus:z-10">
                  {selected.value && (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  )}
                  <p className="ml-2.5 text-sm font-medium">{selected.title}</p>
                </div>
                <div className="relative inline-flex items-center p-2 rounded-r text-sm font-medium focus:outline-none focus:z-10">
                  <KeyboardArrowDown className="h-5 w-5" aria-hidden="true" />
                </div>
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
              <Listbox.Options
                className={`origin-top-right absolute z-10 mt-2 w-auto lg:w-72 rounded-md shadow-lg overflow-hidden bg-gray-100 divide-y divide-gray-300 ring-1 ring-gray-400 focus:outline-none ${
                  props.position ? "md:right-0 md:left-auto" : "left-0"
                }`}
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.title}
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
                          <p
                            className={
                              selected ? "font-semibold" : "font-normal"
                            }
                          >
                            {option.title}
                          </p>
                          {selected ? (
                            <span
                              className={`transition-all duration-100 ease-in-out ${
                                active ? "text-white" : "text-primary-500"
                              }`}
                            >
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
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
      )}
    </Listbox>
  );
}
