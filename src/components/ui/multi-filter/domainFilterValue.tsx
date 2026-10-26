import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { CareFilterValue, toDomainValues } from "./careuiAdapter";
import { SelectedDateBadge } from "./dateFilter";
import FilterRenderer from "./filterRenderer";
import { FilterDateRange, FilterState } from "./utils/Utils";

interface DomainFilterValueProps {
  state: FilterState;
  values: CareFilterValue[];
  selectedFilters: Record<string, FilterState>;
  onChange: (values: CareFilterValue[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  facilityId?: string;
  className?: string;
}

export function DomainFilterValue({
  state,
  values,
  selectedFilters,
  onChange,
  open,
  onOpenChange,
  facilityId,
  className,
}: DomainFilterValueProps) {
  const { t } = useTranslation();
  const selected = toDomainValues(state, values);
  const { filter } = state;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-slot="filter-value"
          aria-label={t("filter_value", { field: t(filter.label) })}
          className={cn(
            "min-w-0 flex-1 justify-start font-normal shadow-sm md:flex-none",
            className,
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {values.length === 0 ? (
              t("select")
            ) : filter.type === "date" ? (
              <SelectedDateBadge
                selected={selected as FilterDateRange}
                filter={filter}
                interactive={false}
              />
            ) : (
              filter.renderSelected?.(selected, filter)
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="start">
        <FilterRenderer
          activeFilter={filter.key}
          selectedFilters={{
            ...selectedFilters,
            [filter.key]: { ...state, selected },
          }}
          facilityId={facilityId}
          onFilterChange={(_, next) =>
            onChange(Array.isArray(next) ? next : [next])
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
