import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { Code, ValueSetSystem } from "@/types/questionnaire/code";

interface Props {
  system: ValueSetSystem;
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  disabled?: boolean;
  count?: number;
  searchPostFix?: string;
  wrapTextForSmallScreen?: boolean;
}

export default function ValueSetSelect({
  system,
  value,
  onSelect,
  placeholder = "Search...",
  disabled,
  count = 10,
  searchPostFix = "",
  wrapTextForSmallScreen = false,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const searchQuery = useQuery({
    queryKey: ["valueset", system, "expand", count, search],
    queryFn: query.debounced(routes.valueset.expand, {
      pathParams: { system },
      body: { count, search: search + searchPostFix },
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
            "w-full justify-between",
            wrapTextForSmallScreen
              ? "h-auto md:h-9 whitespace-normal text-left md:truncate"
              : "truncate",
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
              {search.length < 3
                ? t("min_char_length_error", { min_length: 3 })
                : searchQuery.isFetching
                  ? t("searching")
                  : t("no_results_found")}
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
