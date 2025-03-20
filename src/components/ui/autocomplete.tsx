import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDrawer,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";

interface AutoCompleteOption {
  label: string;
  value: string;
}

interface AutocompleteProps {
  options: AutoCompleteOption[];
  isLoading?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  noOptionsMessage?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  popoverClassName?: string;
  "data-cy"?: string;
}

export default function Autocomplete({
  options,
  isLoading = false,
  value,
  onChange,
  onSearch,
  placeholder = "Select...",
  noOptionsMessage = "No options found",
  disabled,
  align = "center",
  popoverClassName,
  "data-cy": dataCy,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);

  const isMobile = useBreakpoints({ default: true, sm: false });

  const commandContent = (
    <>
      <CommandInput
        placeholder="Search option..."
        disabled={disabled}
        onValueChange={onSearch}
        className="outline-none border-none ring-0 shadow-none"
        autoFocus
      />
      <CommandList>
        {isLoading ? (
          <CardListSkeleton count={3} />
        ) : (
          <CommandEmpty>{noOptionsMessage}</CommandEmpty>
        )}
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option.value}
              value={`${option.label} - ${option.value}`}
              onSelect={(v) => {
                const currentValue =
                  options.find((o) => `${o.label} - ${o.value}` === v)?.value ||
                  "";
                onChange(currentValue);
                setOpen(false);
              }}
            >
              <CheckIcon
                className={cn(
                  "mr-2 h-4 w-4",
                  value === option.value ? "opacity-100" : "opacity-0",
                )}
              />
              {option.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Button
          title={
            value
              ? options.find((option) => option.value === value)?.label
              : undefined
          }
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          data-cy={dataCy}
          type="button"
          onClick={() => setOpen(true)}
        >
          <span className="overflow-hidden">
            {value
              ? options.find((option) => option.value === value)?.label
              : placeholder}
          </span>
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
        <CommandDrawer open={open} onOpenChange={setOpen}>
          {commandContent}
        </CommandDrawer>
      </>
    );
  }

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild className={popoverClassName}>
        <Button
          title={selectedOption?.label}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          data-cy={dataCy}
          onClick={() => setOpen(!open)}
        >
          <span className={cn("truncate", !selectedOption && "text-gray-500")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]"
        align={align}
      >
        <Command>{commandContent}</Command>
      </PopoverContent>
    </Popover>
  );
}
