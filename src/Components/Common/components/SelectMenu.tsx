import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Check, KeyboardArrowDown } from "@material-ui/icons";
import clsx from "clsx";

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

export default function SelectMenu<T>(props: Props<T>) {
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
            <Listbox.Button className="inline-flex shadow-sm rounded-md divide-x divide-primary-600">
              <div className="relative z-0 inline-flex shadow-sm rounded-md divide-x divide-primary-600">
                <div className="relative inline-flex items-center bg-primary-500 py-2 pl-3 pr-4 border border-transparent rounded-l-md shadow-sm text-white hover:bg-primary-600 focus:outline-none focus:z-10">
                  {selected.value && (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  )}
                  <p className="ml-2.5 text-sm font-medium">{selected.title}</p>
                </div>
                <div className="relative inline-flex items-center bg-primary-500 p-2 rounded-l-none rounded-r-md text-sm font-medium text-white hover:bg-primary-600 focus:outline-none focus:z-10 ">
                  <span className="sr-only">Change published status</span>
                  <KeyboardArrowDown
                    className="h-5 w-5 text-white"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className={clsx(
                  props.position ? "md:right-0 md:left-auto" : "left-0",
                  "origin-top-right absolute z-10 mt-2 w-72 rounded-md shadow-lg overflow-hidden bg-white divide-y divide-gray-200 ring-1 ring-black ring-opacity-5 focus:outline-none"
                )}
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.title}
                    className={({ active }) =>
                      clsx(
                        active ? "text-white bg-primary-500" : "text-gray-900",
                        "cursor-default select-none relative p-4 text-sm"
                      )
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <p
                            className={clsx(
                              selected ? "font-semibold" : "font-normal"
                            )}
                          >
                            {option.title}
                          </p>
                          {selected ? (
                            <span
                              className={
                                active ? "text-white" : "text-primary-500"
                              }
                            >
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </div>
                        {option.description && (
                          <p
                            className={clsx(
                              active ? "text-primary-200" : "text-gray-500",
                              "mt-2"
                            )}
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
