import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import CareIcon from "../../../CAREUI/icons/CareIcon";

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
  parentRelative?: boolean;
};

/** Deprecated. Use SelectMenuV2. */
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
          <div
            className={
              props.parentRelative || props.parentRelative === undefined
                ? "relative"
                : ""
            }
          >
            <Listbox.Button className="flex w-full rounded border border-gray-400 bg-gray-50 shadow-sm ring-gray-400 transition-all duration-200 ease-in-out hover:bg-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
              <div className="relative z-0 flex w-full">
                <div className="relative flex flex-1 items-center rounded-l border border-transparent py-2 pl-3 pr-4 focus:z-10 focus:outline-none">
                  {selected.value && (
                    <CareIcon className="care-l-check h-5 w-5" />
                  )}
                  <p className="ml-2.5 text-sm font-medium">{selected.title}</p>
                </div>
                <div className="items-center rounded-r p-2 text-sm font-medium focus:z-10 focus:outline-none">
                  <CareIcon className="care-l-angle-down h-5 w-5" />
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
                className={`absolute z-10 max-h-96 w-auto origin-top-right divide-y divide-gray-300 overflow-auto rounded-md bg-gray-100 shadow-lg ring-1 ring-gray-400 focus:outline-none lg:w-72 ${
                  props.position ? "md:left-auto md:right-0" : "left-0"
                }`}
              >
                {options.map((option) => (
                  <Listbox.Option
                    key={option.title}
                    className={({ active }) =>
                      `relative cursor-default select-none p-4 text-sm transition-all duration-100 ease-in-out ${
                        active ? "bg-primary-500 text-white" : "text-gray-900"
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
                              <CareIcon className="care-l-check h-5 w-5 text-xl" />
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
