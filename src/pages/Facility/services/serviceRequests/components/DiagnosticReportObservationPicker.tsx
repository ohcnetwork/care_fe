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

import { useInfiniteList } from "@/hooks/useInfiniteList";

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
    ref,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteList({
    queryKey: ["diagnostic-report-observation-options", facilityId, search],
    ...query.infinite(observationDefinitionApi.list, {
      queryParams: {
        facility: facilityId,
        title: search,
        status: ObservationDefinitionStatus.ACTIVE,
      },
      pageSize: 50,
      debounceInterval: 500,
    }),
    enabled: open && !disabled,
  });

  const selectedIdSet = new Set(selectedIds);
  const options = data?.results.filter(
    (definition) => !selectedIdSet.has(definition.id),
  );

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
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
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t("search_observations")}
            aria-label={t("search_observations")}
          />
          <CommandList>
            {isLoading ? (
              <div role="status" className="p-4 text-sm text-muted-foreground">
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
                        <p className="text-xs text-muted-foreground">
                          {definition.code.display || definition.code.code}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                  {hasNextPage && <div ref={ref} aria-hidden="true" />}
                  {isFetchingNextPage && (
                    <div className="text-center text-sm py-2 text-muted-foreground">
                      {t("loading")}
                    </div>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
