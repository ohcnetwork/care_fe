import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import FilterRenderer from "./filterRenderer";
import FilterMenuItem from "./utils/FilterMenuItem";
import useMultiFilter from "./utils/useMultiFilter";
import useResponsiveFilterMenu, {
  FilterMenuContent,
} from "./utils/useResponsiveFilterMenu";
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
  const { Root, Trigger } = useResponsiveFilterMenu();

  if (!selectedOption) return <></>;

  return (
    <Root open={open} onOpenChange={setOpen}>
      <Trigger asChild>
        <div className="flex items-center gap-2 px-2.5 h-9 border-x border-gray-200 underline cursor-pointer text-sm text-gray-600 whitespace-nowrap">
          {t(selectedOption.label)}
        </div>
      </Trigger>
      <FilterMenuContent
        titleKey="filter_operation"
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        {availableOptions.map((option) => (
          <FilterMenuItem
            key={option.value || option.label}
            onSelect={() => setSelectedOption(option)}
          >
            {t(option.label)}
          </FilterMenuItem>
        ))}
      </FilterMenuContent>
    </Root>
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
  const { Root, Trigger } = useResponsiveFilterMenu();

  if (!selectedOperation) return <></>;

  return (
    <Root
      open={openState || false}
      onOpenChange={(isOpen) => setOpenState(isOpen)}
    >
      <div
        className={cn(
          "flex items-center bg-white rounded-md border border-gray-200 w-fit",
          selectedBarClassName,
        )}
      >
        <Trigger asChild>
          <div
            className="flex items-center gap-2 px-3 h-9 border-gray-200 text-sm"
            onClick={onClick}
          >
            {filter?.icon}
            <span className="truncate text-gray-950 font-medium cursor-pointer">
              {t(filter.label)}
            </span>
          </div>
        </Trigger>
        <SubMenuFilter
          selectedOption={selectedOperation ?? null}
          setSelectedOption={(operation) =>
            onOperationChange(filter.key, operation.value || operation.label)
          }
          availableOptions={availableOperations ?? []}
        />
        <div className="flex items-center gap-2 px-3 h-9 border-gray-200 whitespace-nowrap">
          <span className="truncate text-gray-950 font-medium">
            {filter.renderSelected?.(selected, filter, onFilterChange)}
          </span>
        </div>
        {!filter?.disableClear && (
          <Button
            variant="ghost"
            onClick={clearFilter}
            className="flex border-l rounded-l-none border-gray-200 hover:bg-gray-50"
          >
            <X className="h-5 w-5 text-gray-600" />
          </Button>
        )}
      </div>
      <FilterMenuContent titleKey={filter.label} className="w-[320px]">
        <FilterRenderer
          activeFilter={filter.key}
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
          facilityId={facilityId}
        />
      </FilterMenuContent>
    </Root>
  );
}
