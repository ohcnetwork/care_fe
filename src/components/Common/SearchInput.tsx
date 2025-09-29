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
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { isValidPhoneNumber } from "react-phone-number-input";

interface SearchOption {
  key: string;
  type: "text" | "phone";
  placeholder: string;
  value: string;
  component?: React.ComponentType<HTMLDivElement>;
  display: string;
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
  const { t } = useTranslation();
  return (
    <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex items-center space-x-2 text-xs text-gray-500">
      {open ? (
        <span className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-500">
          <kbd>{t("esc")}</kbd>
        </span>
      ) : (
        <ShortcutBadge
          actionId="search-input-shortcut"
          className="text-gray-500"
        />
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
  onSearch,
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
  onSearch: (key: string, value: string) => void;
}) => {
  const handlePhoneChange = useCallback(
    (value: string | undefined) => {
      const phoneValue = value || "";
      setSearchValue(phoneValue);

      // Only validate if there's a value and it's not empty
      if (phoneValue && phoneValue.trim() !== "") {
        const isValid = isValidPhoneNumber(phoneValue);

        // Only call onSearch if the phone number is valid
        if (isValid) {
          onSearch(selectedOption.key, phoneValue);
        }
      } else {
        onSearch(selectedOption.key, phoneValue);
      }
    },
    [selectedOption.key, onSearch, setSearchValue],
  );

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchValue(value);
      onSearch(selectedOption.key, value);
    },
    [selectedOption.key, onSearch, setSearchValue],
  );

  switch (selectedOption.type) {
    case "phone":
      return (
        <div className="relative">
          <PhoneInput
            name={selectedOption.key}
            placeholder={selectedOption.placeholder}
            value={searchValue}
            onChange={handlePhoneChange}
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
            onChange={handleTextChange}
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
  const { t } = useTranslation();

  // Always call hooks at the top level
  const initialOptionIndex = Math.max(
    options?.findIndex((option) => option.value !== "") ?? -1,
    0,
  );
  const [selectedOptionIndex, setSelectedOptionIndex] =
    useState(initialOptionIndex);
  const [searchValue, setSearchValue] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Safe access to options
  const safeOptions = useMemo(() => options || [], [options]);
  const selectedOption = safeOptions[selectedOptionIndex] || safeOptions[0];
  const isSingleOption = safeOptions.length === 1;
  const hasOptions = safeOptions.length > 0;
  const handleOptionChange = useCallback(
    (index: number) => {
      // Ensure index is within bounds
      if (index < 0 || index >= safeOptions.length) {
        return;
      }
      setSelectedOptionIndex(index);
      const option = safeOptions[index];
      setSearchValue(option.value || "");
      setFocusedIndex(safeOptions.findIndex((op) => op.key === option.key));
      setOpen(false);
      inputRef.current?.focus();

      // Only call onSearch if there's a value to search
      if (option.value) {
        onSearch(option.key, option.value);
      }
      onFieldChange?.(safeOptions[index]);
    },
    [onSearch, safeOptions, onFieldChange],
  );

  const unselectedOptions = safeOptions.filter(
    (option) => option.key !== selectedOption?.key,
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
          if (focusedIndex >= 0 && focusedIndex < unselectedOptions.length) {
            const selectedOptionIndex = options.findIndex(
              (option) => option.key === unselectedOptions[focusedIndex].key,
            );
            handleOptionChange(selectedOptionIndex);
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    focusedIndex,
    open,
    handleOptionChange,
    safeOptions,
    unselectedOptions,
    options,
  ]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus, open, selectedOptionIndex]);

  // Handle empty options case after all hooks
  if (!hasOptions) {
    return (
      <div
        className={cn(
          "border rounded-lg border-gray-200 bg-white shadow-sm",
          className,
        )}
      >
        <div className="flex items-center rounded-lg p-3">
          <div className="text-gray-500 text-sm">
            {t("no_search_options_available")}
          </div>
        </div>
      </div>
    );
  }

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
                            {t(safeOptions[selectedOptionIndex]?.display || "")}
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
                                    safeOptions.findIndex(
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
                                  {t(option.display)}
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
            onSearch={onSearch}
            {...props}
          />
        </div>
      </div>

      {enableOptionButtons && !isSingleOption && (
        <div className="flex flex-wrap gap-2 p-2 border-t rounded-b-lg bg-gray-50 border-t-gray-100">
          {safeOptions.map((option, i) => (
            <Button
              key={option.key}
              onClick={() => handleOptionChange(i)}
              variant="outline"
              size="xs"
              className={cn(
                selectedOption?.key === option.key
                  ? "bg-primary-100 text-primary-700 hover:bg-primary-200 border-primary-400"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                buttonClassName,
              )}
            >
              {t(option.display)}
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
