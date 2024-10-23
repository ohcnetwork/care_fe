import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CareIcon from "@/CAREUI/icons/CareIcon";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchOption {
  key: string;
  label: string;
  type: "text" | "phone";
  placeholder: string;
  value: string;
  shortcut_key: string;
  component?: React.ComponentType<any>;
}

interface SearchByMultipleFieldsProps {
  options: SearchOption[];
  onSearch: (key: string, value: string) => void;
  initialOption?: SearchOption;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

const SearchByMultipleFields: React.FC<SearchByMultipleFieldsProps> = ({
  options,
  onSearch,
  initialOption,
  className,
  inputClassName,
  buttonClassName,
}) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<SearchOption>(
    initialOption || options[0],
  );
  const [searchValue, setSearchValue] = useState(selectedOption.value || "");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        setOpen(true);
      }

      if (open) {
        if (e.key === "Escape") {
          setOpen(false);
        }
      }

      options.forEach((option) => {
        if (e.key.toLowerCase() === option.shortcut_key.toLowerCase()) {
          e.preventDefault();
          handleOptionChange(option);
        }
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedOption]);
  const handleOptionChange = useCallback(
    (option: SearchOption) => {
      setSelectedOption(option);
      setSearchValue(option.value || "");
      setOpen(false);
      inputRef.current?.focus();
      onSearch(option.key, option.value);
    },
    [onSearch],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      onSearch(selectedOption.key, value);
    },
    [selectedOption, onSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      console.log(e.key);
      if (e.key === "Escape") {
        setSearchValue("");
        onSearch(selectedOption.key, "");
      }
      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
    },
    [selectedOption, onSearch],
  );

  const renderSearchInput = useMemo(() => {
    const commonProps = {
      ref: inputRef,
      value: searchValue,
      onChange: (e: FieldChangeEvent<string>) =>
        handleSearchChange(e.target ? e.target.value : e.value),
      onKeyDown: handleKeyDown,
      className: cn(
        "flex-grow border-none shadow-none focus-visible:ring-0 h-10",
        inputClassName,
      ),
    };

    switch (selectedOption.type) {
      case "phone":
        return (
          <PhoneNumberFormField
            name={selectedOption.key}
            placeholder={t(selectedOption.placeholder)}
            types={["mobile", "landline"]}
            {...commonProps}
          />
        );
      default:
        return (
          <Input
            type="text"
            placeholder={t(selectedOption.placeholder)}
            {...commonProps}
          />
        );
    }
  }, [
    selectedOption,
    searchValue,
    handleSearchChange,
    handleKeyDown,
    t,
    inputClassName,
  ]);

  return (
    <div className={className}>
      <div className="flex items-center rounded-t-lg border-x border-t border-gray-200 bg-white">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="focus:ring-0"
              size="sm"
              onClick={() => setOpen(true)}
            >
              <CareIcon icon="l-search" className="mr-2 h-4 w-4" />/
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.key}
                      onSelect={() => handleOptionChange(option)}
                    >
                      <CareIcon icon="l-search" className="mr-2 h-4 w-4" />
                      <span className="flex-1">{t(option.label)}</span>
                      <kbd className="ml-auto text-xs text-gray-400">
                        {option.label.charAt(0).toUpperCase()}
                      </kbd>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {renderSearchInput}
      </div>
      <div className="flex flex-wrap gap-2 rounded-b-lg border-x border-b border-gray-200 bg-gray-50 p-2 shadow">
        {options.map((option) => (
          <Button
            key={option.key}
            onClick={() => handleOptionChange(option)}
            variant="outline"
            size="xs"
            className={cn(
              selectedOption.key === option.key
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              buttonClassName,
            )}
          >
            {t(option.label)}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SearchByMultipleFields;
