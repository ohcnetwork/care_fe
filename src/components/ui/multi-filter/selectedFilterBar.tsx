import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useIsMobile } from "@/hooks/use-mobile";
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
        <Button
          variant="outline"
          data-slot="filter-operator"
          className="text-muted-foreground hover:text-foreground font-normal underline underline-offset-4 shadow-sm"
        >
          {t(selectedOption.label)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--anchor-width) p-0" align="start">
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
  selectedValueClassName,
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
  selectedValueClassName?: string;
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { filter, selected, selectedOperation, availableOperations } =
    useMultiFilter(selectedFilterKey, selectedFilters);

  if (!selectedOperation) return <></>;

  const fieldButton = (
    <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        data-slot="filter-field"
        className="text-foreground [&_svg]:text-muted-foreground min-w-0 flex-1 justify-start font-medium md:flex-none"
        onClick={onClick}
      >
        {filter.icon}
        <span className="truncate">{t(filter.label)}</span>
      </Button>
    </DropdownMenuTrigger>
  );

  const operatorDropdown = (
    <SubMenuFilter
      selectedOption={selectedOperation}
      setSelectedOption={(operation) =>
        onOperationChange(filter.key, operation.value || operation.label)
      }
      availableOptions={availableOperations ?? []}
    />
  );

  const selectedValue = (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      {filter.renderSelected?.(selected, filter, onFilterChange)}
    </div>
  );
  const valueClassName = cn(
    "min-w-0 flex-1 justify-start font-normal shadow-sm md:flex-none md:max-w-64 lg:max-w-80 xl:max-w-96",
    selectedValueClassName,
  );
  // These renderers own menu/tooltip triggers; keep their shell noninteractive.
  const valueOwnsTrigger =
    filter.type === "date" ||
    filter.type === "tag" ||
    filter.type === "activity_definition";
  const valueSelector = valueOwnsTrigger ? (
    <ButtonGroupText
      data-slot="filter-value"
      className={cn(buttonVariants({ variant: "outline" }), valueClassName)}
    >
      {selectedValue}
    </ButtonGroupText>
  ) : (
    <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        data-slot="filter-value"
        className={valueClassName}
        onClick={onClick}
      >
        {selectedValue}
      </Button>
    </DropdownMenuTrigger>
  );

  const removeButton = !filter.disableClear && (
    <Button
      variant="outline"
      data-slot="filter-remove"
      onClick={clearFilter}
      aria-label={t("remove_filter")}
      aria-description={t(filter.label)}
      size="icon"
      className="text-muted-foreground hover:text-foreground"
    >
      <X />
    </Button>
  );

  return (
    <DropdownMenu
      open={openState || false}
      onOpenChange={(isOpen) => setOpenState(isOpen)}
    >
      {isMobile ? (
        <div
          data-slot="filter-chip"
          role="group"
          aria-label={t(filter.label)}
          className={cn(
            "bg-muted-background flex w-full max-w-full min-w-0 flex-col rounded-lg p-1",
            selectedBarClassName,
          )}
        >
          <ButtonGroup className="grid w-full grid-cols-2 [&>*:not(:first-child)]:rounded-l-none! [&>*:not(:last-child)]:rounded-r-none! [&>*:not(:first-child)]:border-l-0! [&>*]:rounded-b-none! [&>*]:shadow-none! [&>[data-slot]:not(:has(~[data-slot]))]:rounded-br-none!">
            {fieldButton}
            {operatorDropdown}
          </ButtonGroup>
          <ButtonGroup className="w-full [&>*:not(:first-child)]:rounded-l-none! [&>*:not(:last-child)]:rounded-r-none! [&>*]:border-t-0! [&>*:not(:first-child)]:border-l-0! [&>*]:rounded-t-none! [&>*]:shadow-none! [&>[data-slot]:not(:has(~[data-slot]))]:rounded-tr-none!">
            {valueSelector}
            {removeButton}
          </ButtonGroup>
        </div>
      ) : (
        <ButtonGroup
          data-slot="filter-chip"
          aria-label={t(filter.label)}
          className={cn(
            "w-fit max-w-full min-w-0 shrink-0 [&>*:not(:first-child)]:rounded-l-none! [&>*:not(:last-child)]:rounded-r-none! [&>*:not(:first-child)]:border-l-0!",
            selectedBarClassName,
          )}
        >
          {fieldButton}
          {operatorDropdown}
          {valueSelector}
          {removeButton}
        </ButtonGroup>
      )}
      <DropdownMenuContent className="w-80 p-0" align="start">
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
