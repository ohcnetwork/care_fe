import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { debounce } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { DropdownTransition } from "@/components/Common/HelperComponents";
import {
  MultiSelectOptionChip,
  dropdownOptionClassNames,
} from "@/components/Form/MultiSelectMenuV2";

import { classNames } from "@/Utils/utils";

interface Props {
  id?: string;
  name?: string;
  selected: any | any[];
  fetchData: (search: string) => Promise<any> | undefined;
  onChange: (selected: any) => void;
  optionLabel?: (option: any) => string;
  optionLabelChip?: (option: any) => string;
  showNOptions?: number | undefined;
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
  filter?: (data: any) => boolean;
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
    showNOptions,
    multiple = false,
    compareBy,
    debounceTime = 300,
    className = "",
    placeholder,
    disabled = false,
    required = false,
    error,
    filter,
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
        const data = ((await fetchData(query)) || [])?.filter((d: any) =>
          filter ? filter(d) : true,
        );

        if (showNOptions !== undefined) {
          setData(data.slice(0, showNOptions));
        } else {
          setData(data);
        }
        setLoading(false);
      }, debounceTime),
    [fetchData, showNOptions, debounceTime],
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
        immediate
      >
        <div className="relative mt-1">
          <div className="relative flex">
            <ComboboxInput
              id={id}
              name={name}
              className={classNames(
                "cui-input-base truncate pr-16",
                error && "border-danger-500",
              )}
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
                props.onBlur?.();
              }}
              autoComplete="off"
            />
            {!disabled && (
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                <div className="absolute right-0 mr-2 flex items-center text-lg text-secondary-900">
                  {hasSelection && !loading && !required && (
                    <div className="tooltip" id="clear-button">
                      <CareIcon
                        icon="l-times-circle"
                        className="h-4 w-4 text-secondary-800 transition-colors duration-200 ease-in-out hover:text-secondary-500"
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
                    <CareIcon icon="l-spinner" className="animate-spin" />
                  ) : (
                    <CareIcon id="dropdown-toggle" icon="l-angle-down" />
                  )}
                </div>
              </ComboboxButton>
            )}
          </div>
          <DropdownTransition>
            <ComboboxOptions
              modal={false}
              as="ul"
              className="cui-dropdown-base absolute top-12 z-10 text-sm"
            >
              {data?.length === 0 ? (
                <div className="relative cursor-default select-none px-4 py-2 text-secondary-700">
                  {query !== ""
                    ? "Nothing found."
                    : "Start typing to search..."}
                </div>
              ) : (
                data?.map((item: any) => (
                  <ComboboxOption
                    as="li"
                    key={item.id}
                    className={dropdownOptionClassNames}
                    value={item}
                  >
                    {({ selected }) => (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {optionLabel(item)}
                          {optionLabelChip(item) && (
                            <div className="mt-1 h-fit max-w-fit rounded-full border border-secondary-400 bg-secondary-100 px-2 text-center text-xs text-secondary-900 sm:mt-0">
                              {optionLabelChip(item)}
                            </div>
                          )}
                        </div>
                        {selected && (
                          <CareIcon icon="l-check" className="text-lg" />
                        )}
                      </div>
                    )}
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </DropdownTransition>
          {multiple && selected?.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2">
              {selected?.map((option: any) => (
                <MultiSelectOptionChip
                  label={optionLabel(option)}
                  onRemove={() =>
                    onChange(
                      selected.filter((item: any) => item.id !== option.id),
                    )
                  }
                />
              ))}
            </div>
          )}
          {error && (
            <div className="mt-1 text-xs font-medium text-danger-500">
              {error}
            </div>
          )}
        </div>
      </Combobox>
    </div>
  );
};

export default AutoCompleteAsync;
