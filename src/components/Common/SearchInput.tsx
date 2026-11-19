import { Search } from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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
  hideSearchButton?: boolean;
  /** Shows a leading search icon when there is no search-type trigger. */
  showSearchIcon?: boolean;
  /**
   * How the search type is picked when there are multiple options.
   * - `popover`: search icon popover with option buttons below the input.
   * - `select`: a select dropdown joined to the start of the input.
   */
  selectorVariant?: "popover" | "select";
  onFieldChange?: (options: SearchOption) => void;
  autoFocus?: boolean;
}

const SearchInputFieldRenderer = ({
  selectedOption,
  searchValue,
  setSearchValue,
  inputRef,
  inputClassName,
  autoFocus,
  isSingleOption,
  onSearch,
  searchTrigger,
  showSearchIcon,
  grouped,
  ...prop
}: {
  selectedOption: SearchOption;
  searchValue: string;
  setSearchValue: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  inputClassName?: string;
  autoFocus?: boolean;
  isSingleOption: boolean;
  onSearch: (key: string, value: string) => void;
  searchTrigger?: React.ReactNode;
  showSearchIcon?: boolean;
  /** Rendered after a joined control inside a ButtonGroup. */
  grouped?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const { t } = useTranslation();
  const hasValue = searchValue.length !== 0;
  const showClear = hasValue && !prop.disabled && !prop.readOnly;

  const handleClear = () => {
    setSearchValue("");
    onSearch(selectedOption.key, "");
    inputRef?.current?.focus();
  };

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

  if (selectedOption.type === "phone") {
    return (
      <div
        data-slot="phone-search-input"
        className="flex w-full min-w-0 items-center gap-2"
      >
        {searchTrigger}
        <div className="relative min-w-0 flex-1">
          <PhoneInput
            name={selectedOption.key}
            placeholder={selectedOption.placeholder}
            value={searchValue}
            onChange={handlePhoneChange}
            className={cn(
              "min-w-0 bg-background",
              (!isSingleOption || hasValue) && "[&_input]:pr-20",
              grouped && "rounded-l-none border-l-0",
              inputClassName,
            )}
            autoFocus={autoFocus}
            ref={inputRef}
            {...prop}
          />
          {showClear ? (
            <div className="absolute inset-y-0 right-1.5 flex items-center">
              <InputGroupButton
                size="icon-sm"
                aria-label={t("clear_search")}
                onClick={handleClear}
              >
                <CareIcon icon="l-times" />
              </InputGroupButton>
            </div>
          ) : (
            !isSingleOption && (
              <div
                data-shortcut-target
                onClick={() => inputRef?.current?.focus()}
                className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center"
              >
                <ShortcutBadge actionId="search-input-shortcut" />
              </div>
            )
          )}
        </div>
      </div>
    );
  }
  return (
    <InputGroup className="bg-background">
      <InputGroupInput
        type="text"
        placeholder={selectedOption.placeholder}
        ref={inputRef}
        value={searchValue}
        onChange={handleTextChange}
        className={inputClassName}
        autoFocus={autoFocus}
        {...prop}
      />
      {searchTrigger ? (
        <InputGroupAddon align="inline-start">{searchTrigger}</InputGroupAddon>
      ) : (
        showSearchIcon && (
          <InputGroupAddon align="inline-start">
            <Search aria-hidden="true" />
          </InputGroupAddon>
        )
      )}
      {showClear ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-sm"
            aria-label={t("clear_search")}
            onClick={handleClear}
          >
            <CareIcon icon="l-times" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : (
        !isSingleOption && (
          <InputGroupAddon align="inline-end" data-shortcut-target>
            <ShortcutBadge actionId="search-input-shortcut" />
          </InputGroupAddon>
        )
      )}
    </InputGroup>
  );
};

export default function SearchInput({
  options,
  onSearch,
  className,
  inputClassName,
  buttonClassName,
  onFieldChange,
  enableOptionButtons = true,
  hideSearchButton = false,
  showSearchIcon = false,
  selectorVariant = "popover",
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
  const [searchValue, setSearchValue] = useState(
    options?.[initialOptionIndex]?.value ?? "",
  );
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusInputOnSelectClose = useRef(false);

  // Safe access to options
  const safeOptions = useMemo(() => options || [], [options]);
  const selectedOption = safeOptions[selectedOptionIndex] || safeOptions[0];
  const isSingleOption = safeOptions.length === 1;
  const hasOptions = safeOptions.length > 0;
  const showTypeSelect = selectorVariant === "select" && !isSingleOption;
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

  const selectedOptionValue = selectedOption?.value;

  const [prevSelectedOptionValue, setPrevSelectedOptionValue] =
    useState(selectedOptionValue);
  if (selectedOptionValue !== prevSelectedOptionValue) {
    setPrevSelectedOptionValue(selectedOptionValue);
    if (selectedOptionValue !== undefined) {
      setSearchValue(selectedOptionValue);
    }
  }

  const unselectedOptions = safeOptions.filter(
    (option) => option.key !== selectedOption?.key,
  );

  if (!hasOptions) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {t("no_search_options_available")}
      </p>
    );
  }

  const searchTrigger = !isSingleOption && !hideSearchButton && (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <InputGroupButton size="icon-xs" aria-label={t("search_by")}>
          <CareIcon icon="l-search" />
        </InputGroupButton>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandList>
            <CommandGroup heading={t("search_by")}>
              <div className="px-2 pb-2">
                <Button
                  onClick={() => {
                    setOpen(false);
                    inputRef.current?.focus();
                  }}
                  variant="outline"
                  size="sm"
                >
                  <CareIcon icon="l-check" />
                  {t(selectedOption.display)}
                </Button>
              </div>
            </CommandGroup>
            <Separator />
            <CommandGroup heading={t("choose_other_search_type")}>
              {unselectedOptions.map((option) => (
                <CommandItem
                  key={option.key}
                  onSelect={() =>
                    handleOptionChange(
                      safeOptions.findIndex(
                        (candidate) => candidate.key === option.key,
                      ),
                    )
                  }
                >
                  <span className="flex-1">{t(option.display)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  const searchField = (
    <SearchInputFieldRenderer
      selectedOption={selectedOption}
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      inputRef={inputRef}
      inputClassName={inputClassName}
      autoFocus={autoFocus}
      isSingleOption={isSingleOption}
      onSearch={onSearch}
      searchTrigger={showTypeSelect ? undefined : searchTrigger}
      showSearchIcon={showSearchIcon || showTypeSelect}
      grouped={showTypeSelect}
      {...props}
    />
  );

  return (
    <div className={cn("space-y-2", className)}>
      {showTypeSelect ? (
        <ButtonGroup className="w-full">
          <Select
            value={selectedOption.key}
            onValueChange={(key) => {
              focusInputOnSelectClose.current = true;
              handleOptionChange(
                safeOptions.findIndex((option) => option.key === key),
              );
            }}
          >
            <SelectTrigger
              aria-label={t("search_by")}
              className={cn("w-auto! shrink-0 bg-background", buttonClassName)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="start"
              // Resolved after the popup unmounts, so the ref points at the
              // newly rendered input (e.g. text -> phone) rather than the old one.
              finalFocus={() => {
                if (!focusInputOnSelectClose.current) return true;
                focusInputOnSelectClose.current = false;
                return inputRef.current ?? true;
              }}
            >
              {safeOptions.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {t(option.display)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {searchField}
        </ButtonGroup>
      ) : (
        searchField
      )}
      {enableOptionButtons && !isSingleOption && !showTypeSelect && (
        <div className="flex flex-wrap gap-2">
          {safeOptions.map((option, index) => (
            <Button
              key={option.key}
              onClick={() => handleOptionChange(index)}
              variant={
                selectedOption.key === option.key ? "secondary" : "outline"
              }
              aria-pressed={selectedOption.key === option.key}
              size="xs"
              className={cn(
                buttonClassName,
                "aria-pressed:bg-primary-700/10 aria-pressed:hover:bg-primary-700/20 aria-pressed:text-primary-700 aria-pressed:hover:text-primary-900 dark:aria-pressed:text-primary-300 dark:aria-pressed:hover:text-primary-200",
              )}
            >
              {t(option.display)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
