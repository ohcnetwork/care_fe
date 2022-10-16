import React, { Fragment, useEffect, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { Check, KeyboardArrowDown, Close } from "@material-ui/icons";
import Spinner from "../Common/Spinner";

interface Props {
  name?: string;
  selected: any | any[];
  fetchData: (search: string) => Promise<any> | undefined;
  onChange: (selected: any) => void;
  getOptionLabel?: (option: any) => string;
  showNOptions?: number;
  multiple?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
}

const AutoCompleteAsync = (props: Props) => {
  const {
    name,
    selected,
    fetchData,
    onChange,
    getOptionLabel = (option: any) => option.label,
    showNOptions = 10,
    multiple = false,
    className = "",
    placeholder,
    error,
  } = props;
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (multiple && selected?.length > 0) return `${selected.length} selected`;
    if (!multiple && selected) return getOptionLabel(selected);
    return "Start typing to search...";
  };

  useEffect(() => {
    const fetchDataAsync = async () => {
      setLoading(true);
      const data = await fetchData(query);
      setData(data?.slice(0, showNOptions) || []);
      setLoading(false);
    };

    fetchDataAsync();
  }, [query, fetchData, showNOptions]);

  return (
    <div className={className}>
      <Combobox
        name={name}
        value={selected}
        multiple={multiple}
        onChange={onChange}
      >
        <div className="relative mt-1">
          <div className="w-full flex rounded bg-gray-200 focus:border-primary-400 border-2 outline-none ring-0 transition-all duration-200 ease-in-out">
            <Combobox.Button
              onClick={(event: React.MouseEvent) => event.preventDefault()}
              className="block w-full pl-3 pr-10 py-1 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm"
            >
              <Combobox.Input
                className="w-full border-none text-sm leading-5 text-gray-900 focus:ring-0 bg-inherit shadow-none"
                placeholder={getPlaceholder()}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                {loading && <Spinner />}
                <KeyboardArrowDown
                  className="h-5 w-5 text-gray-900"
                  aria-hidden="true"
                />
              </div>
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="z-40 absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {data?.length === 0 ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  {query !== ""
                    ? "Nothing found."
                    : "Start typing to search..."}
                </div>
              ) : (
                data?.map((item: any) => (
                  <Combobox.Option
                    key={item.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-teal-600 text-white" : "text-gray-900"
                      }`
                    }
                    value={item}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {getOptionLabel(item)}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-teal-600"
                            }`}
                          >
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
          {multiple && selected?.length > 0 && (
            <div className="p-2 flex flex-wrap gap-2">
              {selected?.map((option: any) => (
                <span className="bg-gray-200 border border-gray-400 text-gray-800 rounded-full text-xs px-2 py-1">
                  {getOptionLabel(option)}
                  <Close
                    className="h-3 w-3 ml-1 text-gray-700 cursor-pointer"
                    onClick={() => {
                      onChange(
                        selected.filter((item: any) => item.id !== option.id)
                      );
                    }}
                  />
                </span>
              ))}
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm font-medium mt-1">{error}</div>
          )}
        </div>
      </Combobox>
    </div>
  );
};

export default AutoCompleteAsync;
