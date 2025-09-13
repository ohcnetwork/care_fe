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

import Filter from "./filter";
import useMultiFilter from "./utils/useMultiFilter";
import { FilterState, FilterValues } from "./utils/utils";

function SubMenuFilter({
  selectedOption,
  setSelectedOption,
  availableOptions,
}: {
  selectedOption: string;
  setSelectedOption: (option: string) => void;
  availableOptions: string[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 underline cursor-pointer text-xs whitespace-nowrap">
          {t(selectedOption ?? "")}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
        align="start"
      >
        {availableOptions.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => setSelectedOption(option)}
          >
            {t(option)}
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
}: {
  selectedFilterKey: string;
  selectedFilters: Record<string, FilterState>;
  onClick: () => void;
  clearFilter: () => void;
  openState: boolean;
  setOpenState: (open: boolean) => void;
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  onOperationChange: (filterKey: string, operation: string) => void;
}) {
  const { t } = useTranslation();
  const { filter, selected, selectedOperation, availableOperations } =
    useMultiFilter(selectedFilterKey, selectedFilters);

  return (
    <DropdownMenu
      open={openState || false}
      onOpenChange={(isOpen) => setOpenState(isOpen)}
    >
      <div className="flex items-center bg-white rounded-md border border-gray-200 h-10 w-fit">
        <DropdownMenuTrigger asChild>
          <div
            className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 text-sm"
            onClick={onClick}
          >
            {filter?.icon}
            <span className="truncate">{t(filter.label)}</span>
          </div>
        </DropdownMenuTrigger>
        <SubMenuFilter
          selectedOption={selectedOperation ?? ""}
          setSelectedOption={(operation) =>
            onOperationChange(filter.key, operation)
          }
          availableOptions={availableOperations ?? []}
        />
        <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200">
          {filter.renderSelected?.(selected)}
        </div>
        <Button
          variant="ghost"
          onClick={clearFilter}
          className="px-3 py-2 hover:bg-gray-50"
        >
          <X className="h-5 w-5 text-gray-600" />
        </Button>
      </div>
      <DropdownMenuContent className="w-[320px] p-0" align="start">
        <Filter
          activeFilter={filter.key}
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
