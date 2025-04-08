import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import useBreakpoints from "@/hooks/useBreakpoints";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { Code } from "@/types/questionnaire/code";

interface Props {
  system: string;
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  disabled?: boolean;
  count?: number;
  searchPostFix?: string;
  wrapTextForSmallScreen?: boolean;
  hideTrigger?: boolean;
  controlledOpen?: boolean;
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
  hideTrigger = false,
  controlledOpen = false,
}: Props) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });

  const searchQuery = useQuery({
    queryKey: ["valueset", system, "expand", count, search],
    queryFn: query.debounced(routes.valueset.expand, {
      pathParams: { system },
      body: { count, search: search + searchPostFix },
    }),
  });

  useEffect(() => {
    if (controlledOpen || internalOpen) {
      setSearch("");
    }
  }, [controlledOpen, internalOpen]);

  const content = (
    <Command filter={() => 1}>
      <CommandInput
        placeholder={t("value_set_search_placeholder")}
        className="outline-hidden border-none ring-0 shadow-none"
        onValueChange={setSearch}
        autoFocus
      />
      <CommandList className="overflow-y-auto">
        <CommandEmpty>
          {search.length < 3 ? (
            <p className="p-4 text-sm text-gray-500">
              {t("min_char_length_error", { min_length: 3 })}
            </p>
          ) : searchQuery.isFetching ? (
            <p className="p-4 text-sm text-gray-500">{t("searching")}</p>
          ) : (
            <p className="p-4 text-sm text-gray-500">{t("no_results_found")}</p>
          )}
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
                setInternalOpen(false);
              }}
            >
              <span>{option.display}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile && !hideTrigger) {
    return (
      <Sheet open={internalOpen} onOpenChange={setInternalOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between border border-primary rounded-md px-5",
              wrapTextForSmallScreen
                ? "h-auto md:h-9 whitespace-normal text-left md:truncate"
                : "truncate",
              !value?.display && "text-gray-400",
            )}
            disabled={disabled}
          >
            <div className="flex items-center">
              <CareIcon
                icon="l-plus"
                className="mr-2 text-5xl text-primary-700 font-normal"
              />
              <span className="text-primary-700 flex items-center font-semibold text-base text-wrap">
                {value?.display || placeholder}
              </span>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[50vh] px-0 pt-2 pb-0 rounded-t-lg"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto rounded-full bg-gray-300 mt-2" />
          <div className="mt-6 h-full">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover
      open={controlledOpen || internalOpen}
      onOpenChange={setInternalOpen}
      modal={true}
    >
      {!hideTrigger && (
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
            <span>{value?.display || placeholder}</span>
            <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      )}

      {hideTrigger ? (
        content
      ) : (
        <PopoverContent className="w-[300px] p-0" align="start">
          {content}
        </PopoverContent>
      )}
    </Popover>
  );
}
