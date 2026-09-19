import { useInfiniteQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
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

import {
  ObservationDefinitionRead,
  ObservationDefinitionStatus,
} from "@/types/emr/observationDefinition/observationDefinition";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";
import query from "@/Utils/request/query";

interface DiagnosticReportObservationPickerProps {
  facilityId: string;
  selectedIds: string[];
  disabled: boolean;
  onSelect: (definition: ObservationDefinitionRead) => void;
}

export function DiagnosticReportObservationPicker({
  facilityId,
  selectedIds,
  disabled,
  onSelect,
}: DiagnosticReportObservationPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["diagnostic-report-observation-options", facilityId, search],
    queryFn: ({ signal, pageParam }) =>
      query.debounced(observationDefinitionApi.list, {
        queryParams: {
          facility: facilityId,
          title: search,
          status: ObservationDefinitionStatus.ACTIVE,
          limit: 50,
          offset: pageParam,
        },
      })({ signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce(
        (count, page) => count + page.results.length,
        0,
      );
      return loaded < lastPage.count && lastPage.results.length > 0
        ? loaded
        : undefined;
    },
    enabled: open && !disabled,
  });

  const options = data?.pages
    .flatMap((page) => page.results)
    .filter((definition) => !selectedIds.includes(definition.id));

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.stopPropagation();
            }
          }}
        >
          <Plus className="size-4" />
          {t("add_observation")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-96 max-w-[calc(100vw-2rem)] p-0"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.stopPropagation();
          }
        }}
      >
        <Command
          shouldFilter={false}
          className="**:data-[slot=command-input-wrapper]:focus-within:border-gray-500"
        >
          <CommandInput
            className="border-0 focus:ring-0"
            value={search}
            onValueChange={setSearch}
            placeholder={t("search_observations")}
            aria-label={t("search_observations")}
          />
          <CommandList>
            {isLoading ? (
              <div role="status" className="p-4 text-sm text-gray-500">
                {t("loading")}
              </div>
            ) : isError ? (
              <div role="alert" className="space-y-2 p-4 text-sm">
                <p>{t("error_loading_definitions")}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  {t("try_again")}
                </Button>
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {t("no_observation_definitions_found")}
                </CommandEmpty>
                <CommandGroup>
                  {options?.map((definition) => (
                    <CommandItem
                      key={definition.id}
                      value={definition.id}
                      onSelect={() => {
                        onSelect(definition);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{definition.title}</p>
                        <p className="text-xs text-gray-500">
                          {definition.code.display || definition.code.code}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          {hasNextPage && !isError && (
            <Button
              variant="ghost"
              className="w-full"
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {isFetchingNextPage ? t("loading") : t("load_more")}
            </Button>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
