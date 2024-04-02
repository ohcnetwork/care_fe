import { useEffect, useState, useMemo } from "react";
import { Combobox } from "@headlessui/react";
import { debounce } from "lodash-es";
import { DropdownTransition } from "../Common/components/HelperComponents";
import CareIcon from "../../CAREUI/icons/CareIcon";
import {
  MultiSelectOptionChip,
  dropdownOptionClassNames,
} from "./MultiSelectMenuV2";
import { useTranslation } from "react-i18next";

interface Props {
  id?: string;
  name?: string;
  selected: any | any[];
  fetchData: (search: string) => Promise<any> | undefined;
  onChange: (selected: any) => void;
  optionLabel?: (option: any) => string;
  optionLabelChip?: (option: any) => string;
  showNOptions?: number;
  multiple?: boolean;
  compareBy?: string;
  debounceTime?: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
}

const AutoCompleteAsync = (props: Props) => {
  const {
    id,
    name,
    selected,
    fetchData,
    onChange,
    optionLabel = (option: any) => option.label,
    optionLabelChip = (option: any) => option.label,
    showNOptions = 10,
    multiple = false,
    compareBy,
    debounceTime = 300,
    className = "",
    placeholder,
    disabled = false,
    required = false,
    error,
  } = props;
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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
        disabled={disabled}
        onChange={onChange}
        by={compareBy}
        multiple={multiple as any}
      >
        <div className="relative mt-1">
          <div className="flex">
            <Combobox.Input
              id={id}
              name={name}
              className="cui-input-base truncate pr-16"
              placeholder={
                multiple && hasSelection
                  ? `${selected.length} selected`
                  : placeholder || "Start typing to search..."
              }
              displayValue={() =>
                hasSelection && !multiple ? optionLabel?.(selected) : ""
              }
              onChange={({ target }) => setQuery(target.value)}
              onFocus={props.onFocus}
              onBlur={() => {
                setQuery("");
                props.onBlur?.();
              }}
              autoComplete="off"
            />
            {!disabled && (
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <div className="absolute right-0 top-1 mr-2 flex items-center text-lg text-secondary-900">
                  {hasSelection && !loading && !required && (
                    <div className="tooltip">
                      <CareIcon
                        icon="l-times-circle"
                        className="mb-[-5px] h-4 w-4 text-gray-800 transition-colors duration-200 ease-in-out hover:text-gray-500"
                        onClick={(e) => {
                          e.preventDefault();
                          onChange(null);
                        }}
                      />
                      <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-xs">
                        {t("clear_selection")}
                      </span>
                    </div>
                  )}
                  {loading ? (
                    <CareIcon
                      icon="l-spinner"
                      className="-mb-1.5 animate-spin"
                    />
                  ) : (
                    <CareIcon icon="l-angle-down" className="-mb-1.5" />
                  )}
                </div>
              </Combobox.Button>
            )}
          </div>
          <DropdownTransition>
            <Combobox.Options className="cui-dropdown-base absolute top-12 z-10 text-sm">
              {data?.length === 0 ? (
                <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {optionLabel(item)}
                          {optionLabelChip(item) && (
                            <div className="mt-1 h-fit max-w-fit rounded-full border border-secondary-400 bg-secondary-100 px-2 text-center text-xs text-gray-900 sm:mt-0">
                              {optionLabelChip(item)}
                            </div>
                          )}
                        </div>
                        {selected && (
                          <CareIcon icon="l-check" className="text-lg" />
                        )}
                      </div>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </DropdownTransition>
          {multiple && selected?.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2">
              {selected?.map((option: any) => (
                <MultiSelectOptionChip
                  label={optionLabel(option)}
                  onRemove={() =>
                    onChange(
                      selected.filter((item: any) => item.id !== option.id)
                    )
                  }
                />
              ))}
            </div>
          )}
          {error && (
            <div className="mt-1 text-sm font-medium text-red-500">{error}</div>
          )}
        </div>
      </Combobox>
    </div>
  );
};

export default AutoCompleteAsync;
