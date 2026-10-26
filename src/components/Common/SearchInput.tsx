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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  onFieldChange?: (options: SearchOption) => void;
  autoFocus?: boolean;
}

const KeyboardShortcutHint = ({ open }: { open: boolean }) => {
  const { t } = useTranslation();
  return open ? (
    <Kbd>{t("esc")}</Kbd>
  ) : (
    <ShortcutBadge actionId="search-input-shortcut" />
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
  searchTrigger,
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
  searchTrigger?: React.ReactNode;
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

  if (selectedOption.type === "phone") {
    return (
      <div className="flex w-full min-w-0 items-center gap-2">
        {searchTrigger}
        <PhoneInput
          name={selectedOption.key}
          placeholder={selectedOption.placeholder}
          value={searchValue}
          onChange={handlePhoneChange}
          className={cn("min-w-0 flex-1", inputClassName)}
          autoFocus={autoFocus}
          ref={inputRef}
          {...prop}
        />
        {!isSingleOption && <KeyboardShortcutHint open={open} />}
      </div>
    );
  }
  return (
    <InputGroup>
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
      {searchTrigger && (
        <InputGroupAddon align="inline-start">{searchTrigger}</InputGroupAddon>
      )}
      {!isSingleOption && (
        <InputGroupAddon align="inline-end">
          <KeyboardShortcutHint open={open} />
        </InputGroupAddon>
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

  useEffect(() => {
    if (selectedOption) {
      setSearchValue(selectedOption.value);
    }
  }, [selectedOption?.value]);

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
        <InputGroupButton
          size="icon-xs"
          aria-label={t("search_by")}
          onClick={() => setOpen(true)}
        >
          <CareIcon icon="l-search" />
        </InputGroupButton>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
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
              {unselectedOptions.map((option, index) => (
                <CommandItem
                  key={option.key}
                  onSelect={() =>
                    handleOptionChange(
                      safeOptions.findIndex(
                        (candidate) => candidate.key === option.key,
                      ),
                    )
                  }
                  className={cn(
                    focusedIndex === index &&
                      "bg-accent text-accent-foreground",
                  )}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onMouseLeave={() => setFocusedIndex(-1)}
                >
                  <span className="flex-1">{t(option.display)}</span>
                  {focusedIndex === index && (
                    <Kbd title={t("press_enter_to_select")}>↵</Kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className={cn("space-y-2", className)}>
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
        searchTrigger={searchTrigger}
        {...props}
      />
      {enableOptionButtons && !isSingleOption && (
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
              className={buttonClassName}
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
          onClick={() => {
            setSearchValue("");
            inputRef.current?.focus();
          }}
        >
          <CareIcon icon="l-times" />
          {t("clear_search")}
        </Button>
      )}
    </div>
  );
}
