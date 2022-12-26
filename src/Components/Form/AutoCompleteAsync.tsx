import React, { useEffect, useState, useMemo } from "react";
import { Combobox } from "@headlessui/react";
import { debounce } from "lodash";
import { DropdownTransition } from "../Common/components/HelperComponents";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { dropdownOptionClassNames } from "./MultiSelectMenuV2";

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
          <div className="flex">
            <Combobox.Input
              name={name}
              className="cui-input-base pr-16 truncate"
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
            <Combobox.Options className="cui-dropdown-base top-12 absolute z-10 mt-2 text-sm">
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
                    className={dropdownOptionClassNames}
                    value={item}
                  >
                    {({ selected }) => (
                      <div className="flex justify-between">
                        {optionLabel(item)}
                        {selected && (
                          <CareIcon className="care-l-check text-lg" />
                        )}
                      </div>
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
