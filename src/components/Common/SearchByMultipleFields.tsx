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
      if (
        e.key === "/" &&
        !(document.activeElement instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        setOpen(true);
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

        if (e.key === "Escape") {
          inputRef.current?.focus();
          setOpen(false);
        }

        options.forEach((option, i) => {
          if (
            e.key.toLocaleLowerCase() ===
              option.shortcutKey.toLocaleLowerCase() &&
            open
          ) {
            e.preventDefault();
            handleOptionChange(i);
          }
        });
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
          <Input
            id={id}
            type="text"
            placeholder={selectedOption.placeholder}
            {...commonProps}
          />
        );
    }
  }, [selectedOption, searchValue, handleSearchChange, t, inputClassName]);

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
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="focus:ring-0 px-2 ml-1"
              size="sm"
              onClick={() => setOpen(true)}
            >
              <CareIcon icon="l-search" className="mr-2 text-base" />/
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {options.map((option, index) => (
                    <CommandItem
                      key={option.key}
                      onSelect={() => handleOptionChange(index)}
                      className={cn({
                        "bg-gray-100": focusedIndex === index,
                        "hover:bg-secondary-100": true,
                      })}
                    >
                      <CareIcon icon="l-search" className="mr-2 h-4 w-4" />
                      <span className="flex-1">{t(option.key)}</span>
                      <kbd className="ml-auto text-xs text-gray-400">
                        {option.shortcutKey}
                      </kbd>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
