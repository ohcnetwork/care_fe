import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
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

import useDebouncedState from "@/hooks/useDebouncedState";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { Code, ValueSetSystem } from "@/types/questionnaire/code";

interface Props {
  system: ValueSetSystem;
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  noResultsMessage?: string;
  disabled?: boolean;
  count?: number;
}

export default function ValueSetSelect({
  system,
  value,
  onSelect,
  placeholder = "Search...",
  noResultsMessage = "No results found",
  disabled,
  count = 10,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useDebouncedState("", 500);

  const searchQuery = useQuery({
    queryKey: ["valueset", system, "expand", count, search],
    queryFn: query(routes.valueset.expand, {
      pathParams: { system },
      body: { count, search },
    }),
  });

  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between truncate",
            !value?.display && "text-gray-400",
          )}
        >
          {value?.display || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command filter={() => 1}>
          <CommandInput
            placeholder={placeholder}
            className="outline-none border-none ring-0 shadow-none"
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery.isFetching ? "Searching..." : noResultsMessage}
            </CommandEmpty>
            <CommandGroup>
              {searchQuery.data?.results.map((option) => (
                <CommandItem
                  key={option.code}
                  value={option.code}
                  onSelect={() => {
                    onSelect({
                      code: option.code,
                      display: option.display || "",
                      system: option.system || "",
                    });
                    setOpen(false);
                  }}
                >
                  <span>{option.display}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
