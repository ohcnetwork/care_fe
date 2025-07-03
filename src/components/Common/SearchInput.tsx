import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { isAppleDevice } from "@/Utils/utils";

interface SearchOption {
  key: string;
  type: "text" | "phone";
  placeholder: string;
  value: string;
  component?: React.ComponentType<HTMLDivElement>;
}

interface SearchInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "ref"> {
  options: SearchOption[];
  onSearch: (key: string, value: string) => void;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  enableOptionButtons?: boolean;
  onFieldChange?: (options: SearchOption) => void;
  autoFocus?: boolean;
}

const KeyboardShortcutHint = ({ open }: { open: boolean }) => {
  return (
    <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex items-center space-x-2 text-xs text-gray-500">
      {open ? (
        <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
          <kbd>Esc</kbd>
        </span>
      ) : isAppleDevice ? (
        <div className="flex gap-1 font-medium">
          <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
            <kbd>⌘</kbd>
          </span>
          <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
            <kbd>K</kbd>
          </span>
        </div>
      ) : (
        <div className="flex gap-1 font-medium">
          <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
            <kbd>Ctrl</kbd>
          </span>
          <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
            <kbd>K</kbd>
          </span>
        </div>
      )}
    </div>
  );
};
const SearchInputFieldRenderer = ({
  selectedOption,
  searchValue,
  setSearchValue,
  inputRef,
  inputClassName,
  autoFocus,
  isSingleOption,
  open,
  ...prop
}: {
  selectedOption: SearchOption;
  searchValue: string;
  setSearchValue: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  inputClassName?: string;
  autoFocus?: boolean;
  isSingleOption: boolean;
  open: boolean;
}) => {
  switch (selectedOption.type) {
    case "phone":
      return (
        <div className="relative">
          <PhoneInput
            name={selectedOption.key}
            placeholder={selectedOption.placeholder}
            value={searchValue}
            onChange={(value) => setSearchValue(value || "")}
            className={inputClassName}
            autoFocus={autoFocus}
            ref={inputRef}
            {...prop}
          />
          {!isSingleOption && <KeyboardShortcutHint open={open} />}
        </div>
      );
    default:
      return (
        <div className="relative">
          <Input
            type="text"
            placeholder={selectedOption.placeholder}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className={cn(
              !isSingleOption &&
                "grow border-none shadow-none focus-visible:ring-0",
              inputClassName,
            )}
            {...prop}
          />
          {!isSingleOption && <KeyboardShortcutHint open={open} />}
        </div>
      );
  }
};
export default function SearchInput({
  options,
  onSearch,
  className,
  inputClassName,
  buttonClassName,
  onFieldChange,
  enableOptionButtons = true,
  autoFocus = false,
  ...props
}: SearchInputProps) {
  const initialOptionIndex = Math.max(
    options.findIndex((option) => option.value !== ""),
    0,
  );
  const { t } = useTranslation();
  const [selectedOptionIndex, setSelectedOptionIndex] =
    useState(initialOptionIndex);
  const selectedOption = options[selectedOptionIndex];
  const [searchValue, setSearchValue] = useState(selectedOption.value || "");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState<string | undefined | boolean>();
  const isSingleOption = options.length == 1;
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

  const unselectedOptions = options.filter(
    (option) => option.key !== selectedOption.key,
  );

  useEffect(() => {
    if (open) {
      setFocusedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        inputRef.current?.focus();
        setOpen(true);
      }

      if (e.key === "Escape") {
        inputRef.current?.focus();
        if (open) {
          setOpen(false);
        } else {
          setSearchValue("");
        }
      }

      if (open) {
        if (e.key === "ArrowDown") {
          setFocusedIndex((prevIndex) =>
            prevIndex === unselectedOptions.length - 1 ? 0 : prevIndex + 1,
          );
        } else if (e.key === "ArrowUp") {
          setFocusedIndex((prevIndex) =>
            prevIndex === 0 ? unselectedOptions.length - 1 : prevIndex - 1,
          );
        } else if (e.key === "Enter") {
          const selectedOptionIndex = options.findIndex(
            (option) => option.key === unselectedOptions[focusedIndex].key,
          );
          handleOptionChange(selectedOptionIndex);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, open, handleOptionChange, options]);

  useEffect(() => {
    if (selectedOption.value !== searchValue) {
      onSearch(selectedOption.key, searchValue);
    }
  }, [searchValue]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus, open, selectedOptionIndex]);

  return (
    <div
      className={cn(
        !isSingleOption &&
          "border rounded-lg border-gray-200 bg-white shadow-sm",
        className,
      )}
    >
      <div
        role="searchbox"
        aria-expanded={open}
        aria-controls="search-options"
        aria-haspopup="listbox"
        className="flex items-center rounded-t-lg gap-1"
      >
        {!isSingleOption && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="focus:ring-0  ml-1"
                size="sm"
                onClick={() => setOpen(true)}
              >
                <CareIcon icon="l-search" className="mr-2 text-base" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="absolute p-0"
              onEscapeKeyDown={(event) => event.preventDefault()}
            >
              <Command>
                <CommandList>
                  <CommandGroup>
                    <div className="p-4">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600">
                          {t("search_by")}
                        </p>
                        <div className="flex mt-2">
                          <Button
                            onClick={() => {
                              setOpen(false);
                              if (inputRef.current) {
                                inputRef.current.focus();
                              }
                            }}
                            variant="outline"
                            size="xs"
                            className="bg-primary-100 text-primary-700 hover:bg-primary-200 border-primary-400"
                          >
                            <CareIcon icon="l-check" className="mr-1" />
                            {t(options[selectedOptionIndex].key)}
                          </Button>
                        </div>
                      </div>
                      <hr className="border-gray-200 mb-3" />
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          {t("choose_other_search_type")}
                        </p>
                        <div className="space-y-2">
                          {unselectedOptions.map((option, index) => {
                            if (selectedOption.key === option.key) return null;

                            return (
                              <CommandItem
                                key={option.key}
                                onSelect={() =>
                                  handleOptionChange(
                                    options.findIndex(
                                      (option) =>
                                        option.key ===
                                        unselectedOptions[index].key,
                                    ),
                                  )
                                }
                                className={cn(
                                  "flex items-center p-2 rounded-md cursor-pointer",
                                  {
                                    "bg-gray-100": focusedIndex === index,
                                    "hover:bg-secondary-100": true,
                                  },
                                )}
                                onMouseEnter={() => setFocusedIndex(index)}
                                onMouseLeave={() => setFocusedIndex(-1)}
                              >
                                <span className="flex-1 text-sm">
                                  {t(option.key)}
                                </span>
                                {focusedIndex === index && (
                                  <kbd
                                    className="ml-2 border border-gray-300 rounded px-1 bg-white text-xs text-gray-500"
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
                    </div>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        <div className="w-full">
          <SearchInputFieldRenderer
            selectedOption={selectedOption}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            inputRef={inputRef}
            inputClassName={inputClassName}
            autoFocus={autoFocus}
            isSingleOption={isSingleOption}
            open={open}
            {...props}
          />
        </div>
      </div>
      {error && (
        <div className="px-2 mb-1 text-xs font-medium tracking-wide transition-opacity duration-300 error-text text-danger-500">
          {t("phone_number_validation_error")}
        </div>
      )}
      {enableOptionButtons && !isSingleOption && (
        <div className="flex flex-wrap gap-2 p-2 border-t rounded-b-lg bg-gray-50 border-t-gray-100">
          {options.map((option, i) => (
            <Button
              key={option.key}
              onClick={() => handleOptionChange(i)}
              variant="outline"
              size="xs"
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
      {searchValue.length !== 0 && !isSingleOption && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-center text-gray-500"
          onClick={() => {
            setSearchValue("");
            inputRef.current?.focus();
          }}
        >
          <CareIcon icon="l-times" className="mr-2 size-4" />
          {t("clear_search")}
        </Button>
      )}
    </div>
  );
}
