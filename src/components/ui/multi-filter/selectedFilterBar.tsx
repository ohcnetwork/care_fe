import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import FilterRenderer from "./filterRenderer";
import useMultiFilter from "./utils/useMultiFilter";
import { FilterState, FilterValues, Operation } from "./utils/Utils";

function SubMenuFilter({
  selectedOption,
  setSelectedOption,
  availableOptions,
}: {
  selectedOption: Operation | null;
  setSelectedOption: (option: Operation) => void;
  availableOptions: Operation[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!selectedOption) return <></>;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 px-2.5 h-9 border-x border-border underline cursor-pointer text-sm text-soft-foreground whitespace-nowrap">
          {t(selectedOption.label)}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
        align="start"
      >
        {availableOptions.map((option) => (
          <DropdownMenuItem
            key={option.value || option.label}
            onSelect={() => setSelectedOption(option)}
          >
            {t(option.label)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SelectedFilterBar({
  selectedFilterKey,
  selectedFilters,
  onClick,
  clearFilter,
  openState,
  setOpenState,
  onFilterChange,
  onOperationChange,
  selectedBarClassName,
  facilityId,
}: {
  selectedFilterKey: string;
  selectedFilters: Record<string, FilterState>;
  onClick: () => void;
  clearFilter: () => void;
  openState: boolean;
  setOpenState: (open: boolean) => void;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  onOperationChange: (filterKey: string, operation: string) => void;
  selectedBarClassName?: string;
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const { filter, selected, selectedOperation, availableOperations } =
    useMultiFilter(selectedFilterKey, selectedFilters);

  if (!selectedOperation) return <></>;

  return (
    <DropdownMenu
      open={openState || false}
      onOpenChange={(isOpen) => setOpenState(isOpen)}
    >
      <div
        className={cn(
          "flex items-center bg-background rounded-md border border-border w-fit",
          selectedBarClassName,
        )}
      >
        <DropdownMenuTrigger asChild>
          <div
            className="flex items-center gap-2 px-3 h-9 border-border text-sm"
            onClick={onClick}
          >
            {filter?.icon}
            <span className="truncate text-foreground font-medium cursor-pointer">
              {t(filter.label)}
            </span>
          </div>
        </DropdownMenuTrigger>
        <SubMenuFilter
          selectedOption={selectedOperation ?? null}
          setSelectedOption={(operation) =>
            onOperationChange(filter.key, operation.value || operation.label)
          }
          availableOptions={availableOperations ?? []}
        />
        <div className="flex items-center gap-2 px-3 h-9 border-border whitespace-nowrap">
          <span className="truncate text-foreground font-medium">
            {filter.renderSelected?.(selected, filter, onFilterChange)}
          </span>
        </div>
        {!filter?.disableClear && (
          <Button
            variant="ghost"
            onClick={clearFilter}
            className="flex border-l rounded-l-none border-border hover:bg-soft-background"
          >
            <X className="h-5 w-5 text-soft-foreground" />
          </Button>
        )}
      </div>
      <DropdownMenuContent className="w-[320px] p-0" align="start">
        <FilterRenderer
          activeFilter={filter.key}
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
          facilityId={facilityId}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
