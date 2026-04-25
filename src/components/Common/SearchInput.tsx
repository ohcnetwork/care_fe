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

interface SearchInputProps extends Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> {
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (selectedOption) {
      setSearchValue(selectedOption.value);
    }
  }, [selectedOption?.value]);

  // When popover opens, highlight the currently active option
  useEffect(() => {
    if (open) {
      setHighlightedIndex(selectedOptionIndex);
    }
  }, [open, selectedOptionIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        inputRef.current?.focus();
        setOpen(true);
        return;
      }

      if (e.key === "Escape") {
        inputRef.current?.focus();
        if (open) {
          setOpen(false);
        } else {
          setSearchValue("");
        }
        return;
      }

      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < safeOptions.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        setHighlightedIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setHighlightedIndex(safeOptions.length - 1);
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        handleOptionChange(highlightedIndex);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, highlightedIndex, safeOptions.length, handleOptionChange]);

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
      <div className="flex items-center rounded-t-lg gap-1">
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
              <div className="p-4">
                <p className="text-sm font-medium text-gray-600 mb-3">
                  {t("search_by")}
                </p>
                <div
                  role="listbox"
                  aria-label={t("search_by")}
                  className="space-y-1"
                >
                  {safeOptions.map((option, i) => (
                    <div
                      key={option.key}
                      role="option"
                      aria-selected={i === highlightedIndex}
                      onClick={() => handleOptionChange(i)}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      className={cn(
                        "flex items-center p-2 rounded-md cursor-pointer text-sm",
                        i === highlightedIndex
                          ? "bg-primary-100 text-primary-700"
                          : "hover:bg-secondary-100",
                      )}
                    >
                      {i === selectedOptionIndex && (
                        <CareIcon icon="l-check" className="mr-1" />
                      )}
                      {t(option.display)}
                    </div>
                  ))}
                </div>
              </div>
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
