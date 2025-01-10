import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { FieldError } from "@/components/Form/FieldValidators";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";

import { isAppleDevice } from "@/Utils/utils";

interface SearchOption {
  key: string;
  type: "text" | "phone";
  placeholder: string;
  value: string;
  shortcutKey: string;
  component?: React.ComponentType<HTMLDivElement>;
}

interface SearchByMultipleFieldsProps {
  id: string;
  options: SearchOption[];
  onSearch: (key: string, value: string) => void;
  initialOptionIndex?: number;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  clearSearch?: { value: boolean; params?: string[] };
  enableOptionButtons?: boolean;
  onFieldChange?: (options: SearchOption) => void;
}

type EventType = React.ChangeEvent<HTMLInputElement> | { value: string };

const SearchByMultipleFields: React.FC<SearchByMultipleFieldsProps> = ({
  id,
  options,
  onSearch,
  initialOptionIndex,
  className,
  inputClassName,
  buttonClassName,
  clearSearch,
  onFieldChange,
  enableOptionButtons = true,
}) => {
  const { t } = useTranslation();
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(
    initialOptionIndex || 0,
  );
  const selectedOption = options[selectedOptionIndex];
  const [searchValue, setSearchValue] = useState(selectedOption.value || "");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState<string | undefined | boolean>();

  useEffect(() => {
    if (!(selectedOption.type === "phone" && searchValue.length < 13)) {
      setSearchValue(options[selectedOptionIndex].value);
    }
  }, [options]);

  useEffect(() => {
    if (clearSearch?.value) {
      const clearinput = options
        .map((op) => op.key)
        .some((element) => clearSearch.params?.includes(element));
      clearinput ? setSearchValue("") : null;
      inputRef.current?.focus();
    }
  }, [clearSearch]);

  const handleOptionChange = useCallback(
    (index: number) => {
      setSelectedOptionIndex(index);
      const option = options[index];
      setSearchValue(option.value || "");
      setFocusedIndex(options.findIndex((op) => op.key === option.key));
      setOpen(false);
      inputRef.current?.focus();
      setError(false);
      onSearch(option.key, option.value);
      onFieldChange?.(options[index]);
    },
    [onSearch],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        inputRef.current?.focus();
        setOpen(false);
      }
      if (open) {
        if (e.key === "ArrowDown") {
          setFocusedIndex((prevIndex) =>
            prevIndex === options.length - 1 ? 0 : prevIndex + 1,
          );
        } else if (e.key === "ArrowUp") {
          setFocusedIndex((prevIndex) =>
            prevIndex === 0 ? options.length - 1 : prevIndex - 1,
          );
        } else if (e.key === "Enter") {
          handleOptionChange(focusedIndex);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, open, handleOptionChange, options]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedOptionIndex]);

  useEffect(() => {
    if (selectedOption.value !== searchValue) {
      onSearch(selectedOption.key, searchValue);
    }
  }, [searchValue, selectedOption.key, selectedOption.value, onSearch]);

  const handleSearchChange = useCallback((event: EventType) => {
    const value = "target" in event ? event.target.value : event.value;
    setSearchValue(value);
  }, []);

  const renderSearchInput = useMemo(() => {
    const commonProps = {
      ref: inputRef,
      value: searchValue,
      onChange: handleSearchChange,
      className: cn(
        "flex-grow border-none shadow-none focus-visible:ring-0 h-10",
        inputClassName,
      ),
    } as const;

    switch (selectedOption.type) {
      case "phone":
        return (
          <PhoneNumberFormField
            id={id}
            name={selectedOption.key}
            placeholder={selectedOption.placeholder}
            types={["mobile", "landline"]}
            {...commonProps}
            errorClassName="hidden"
            hideHelp={true}
            onError={(error: FieldError) => setError(error)}
          />
        );
      default:
        return (
          <div className="relative">
          <Input
            id={id}
            type="text"
            placeholder={selectedOption.placeholder}
            {...commonProps}
          />
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex items-center space-x-2 text-xs text-gray-500">
            {open ? (
              <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
                ESC
              </span>
            ) : (
              <span>
                {isAppleDevice ? (
                  <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
                    ⌘K
                  </span>
                ) : (
                  <div className="flex gap-1 font-medium">
                    <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
                      Ctrl
                    </span>
                    <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
                      K
                    </span>
                  </div>
                )}
              </span>
            )}
          </div>
        </div>
        );
    }
  }, [
    selectedOption,
    searchValue,
    handleSearchChange,
    t,
    inputClassName,
    open,
  ]);

  return (
    <div
      className={cn(
        "border rounded-lg border-gray-200 bg-white shadow",
        className,
      )}
    >
      <div
        role="searchbox"
        aria-expanded={open}
        aria-controls="search-options"
        aria-haspopup="listbox"
        className="flex items-center rounded-t-lg"
      >
        {options.length > 1 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="focus:ring-0 px-2 ml-1"
                size="sm"
                onClick={() => setOpen(true)}
              >
                <CareIcon icon="l-search" className="mr-2 text-base" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandList>
                  <CommandGroup>
                    <div className="p-2">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600">
                          Search by
                        </p>
                        <div className="flex mt-1">
                          <Button
                            onClick={() => setOpen(false)}
                            variant="outline"
                            size="xs"
                            className="bg-primary-100 text-primary-700 hover:bg-primary-200 border-primary-400"
                          >
                            <CareIcon icon="l-check" className="" />
                            {t(options[selectedOptionIndex].key)}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Search by other options
                        </p>
                        {options.map((option, index) => {
                          if (selectedOption.key === option.key) return null;

                          return (
                            <CommandItem
                              key={option.key}
                              onSelect={() => handleOptionChange(index)}
                              className={cn({
                                "bg-gray-100": focusedIndex === index,
                                "hover:bg-secondary-100": true,
                              })}
                              onMouseEnter={() => setFocusedIndex(index)}
                              onMouseLeave={() => setFocusedIndex(-1)}
                            >
                              <span className="flex-1">{t(option.key)}</span>
                              {focusedIndex === index && (
                                <kbd
                                  className="ml-auto px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded shadow-sm hover:bg-gray-300"
                                  title="Press Enter to select"
                                >
                                  ⏎ Enter
                                </kbd>
                              )}
                            </CommandItem>
                          );
                        })}
                      </div>
                    </div>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        <div className="w-full">{renderSearchInput}</div>
      </div>
      {error && (
        <div className="error-text px-2 mb-1 text-xs font-medium tracking-wide text-danger-500 transition-opacity duration-300">
          {t("invalid_phone_number")}
        </div>
      )}
      {enableOptionButtons && (
        <div className="flex flex-wrap gap-2 rounded-b-lg bg-gray-50 border-t border-t-gray-100 p-2">
          {options.map((option, i) => (
            <Button
              key={option.key}
              onClick={() => handleOptionChange(i)}
              variant="outline"
              size="xs"
              data-test-id={id + "__" + option.key}
              className={cn(
                selectedOption.key === option.key
                  ? "bg-primary-100 text-primary-700 hover:bg-primary-200 border-primary-400"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                buttonClassName,
              )}
            >
              {t(option.key)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchByMultipleFields;
