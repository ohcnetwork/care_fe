import React, { useEffect, useState, useMemo } from "react";
import { Combobox } from "@headlessui/react";
import { debounce } from "lodash";
import { DropdownTransition } from "../Common/components/HelperComponents";
import CareIcon from "../../CAREUI/icons/CareIcon";

interface Props {
  name?: string;
  selected: any | any[];
  fetchData: (search: string) => Promise<any> | undefined;
  onChange: (selected: any) => void;
  optionLabel?: (option: any) => string;
  showNOptions?: number;
  multiple?: boolean;
  compareBy?: string;
  debounceTime?: number;
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
    optionLabel = (option: any) => option.label,
    showNOptions = 10,
    multiple = false,
    compareBy,
    debounceTime = 300,
    className = "",
    placeholder,
    error,
  } = props;
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const hasSelection =
    (!multiple && selected) || (multiple && selected?.length > 0);

  const fetchDataAsync = useMemo(
    () =>
      debounce(async (query: string) => {
        setLoading(true);
        const data = await fetchData(query);
        setData(data?.slice(0, showNOptions) || []);
        setLoading(false);
      }, debounceTime),
    [fetchData, showNOptions, debounceTime]
  );

  useEffect(() => {
    fetchDataAsync(query);
  }, [query, fetchDataAsync]);

  return (
    <div className={className}>
      <Combobox
        value={selected}
        onChange={onChange}
        by={compareBy}
        multiple={multiple as any}
      >
        <div className="relative mt-1">
          <div className="w-full flex rounded bg-white disabled:bg-secondary-100 border border-secondary-300 focus:border-primary-400 outline-none ring-0 focus:ring-1 ring-primary-400 transition-all duration-200 ease-in-out py-1">
            <Combobox.Input
              name={name}
              className="w-full border-none text-sm leading-5 text-secondary-700 placeholder:text-secondary-400 font-medium placeholder:font-normal focus:ring-0 bg-inherit shadow-none pr-16 truncate"
              placeholder={
                multiple && hasSelection
                  ? `${selected.length} selected`
                  : placeholder || "Start typing to search..."
              }
              displayValue={() =>
                hasSelection && !multiple
                  ? optionLabel && optionLabel(selected)
                  : ""
              }
              onChange={({ target }) => setQuery(target.value)}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <div className="absolute top-1 right-0 flex items-center mr-2 text-lg text-secondary-900">
                {loading ? (
                  <CareIcon className="care-l-spinner animate-spin -mb-1.5" />
                ) : (
                  <CareIcon className="care-l-angle-down -mb-1.5" />
                )}
              </div>
            </Combobox.Button>
          </div>
          <DropdownTransition>
            <Combobox.Options className="top-12 absolute z-10 mt-2 w-full rounded-md xl:rounded-lg shadow-lg overflow-auto max-h-96 bg-gray-100 divide-y divide-gray-300 ring-1 ring-gray-400 focus:outline-none text-sm">
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
                        active ? "text-white bg-primary-500" : "text-gray-900"
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
                          {optionLabel(item)}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-primary-500"
                            }`}
                          >
                            <CareIcon className="care-l-check text-lg" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </DropdownTransition>
          {multiple && selected?.length > 0 && (
            <div className="p-2 flex flex-wrap gap-2">
              {selected?.map((option: any) => (
                <span className="bg-gray-200 border border-gray-400 text-gray-800 rounded-full text-xs px-2 py-1">
                  {optionLabel(option)}
                  <i
                    className="h-3 w-3 ml-1 text-lg text-gray-700 cursor-pointer"
                    onClick={() => {
                      onChange(
                        selected.filter((item: any) => item.id !== option.id)
                      );
                    }}
                  >
                    <CareIcon className="care-l-multiply" />
                  </i>
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
