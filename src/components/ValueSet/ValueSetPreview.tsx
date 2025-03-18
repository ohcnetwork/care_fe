import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import query from "@/Utils/request/query";
import { CreateValuesetModel } from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

interface LocationSheetProps {
  valueset: CreateValuesetModel;
  disabled: boolean;
  trigger: React.ReactNode;
}

export function ValueSetPreview({
  valueset,
  disabled,
  trigger,
}: LocationSheetProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const searchQuery = useQuery({
    queryKey: ["valueset", "preview_search", search],
    queryFn: query.debounced(valuesetApi.preview_search, {
      queryParams: { search },
      body: valueset,
    }),
    enabled: !disabled,
  });

  useEffect(() => {
    if (internalOpen) {
      setSearch("");
    }
  }, [internalOpen]);

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg pr-2 pl-3">
        <SheetHeader className="space-y-1 px-1">
          <SheetTitle className="text-xl font-semibold">
            {t("valueset_preview")}
          </SheetTitle>
          <p className="text-sm text-gray-500">
            {t("valueset_preview_description")}
          </p>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-3 px-1">
            <Popover open={internalOpen} onOpenChange={setInternalOpen}>
              <PopoverTrigger asChild disabled={disabled}>
                <Button
                  variant="outline"
                  role="combobox"
                  className={"w-full justify-between truncate text-gray-400"}
                >
                  <span>{t("search_concept")}</span>
                  <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command filter={() => 1}>
                  <CommandInput
                    placeholder={t("search")}
                    className="outline-none border-none ring-0 shadow-none"
                    onValueChange={setSearch}
                    autoFocus
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
                        <CommandItem key={option.code} value={option.code}>
                          <span>{option.display}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
