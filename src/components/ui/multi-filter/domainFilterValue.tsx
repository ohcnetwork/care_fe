import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { CareFilterValue, toDomainValues } from "./careuiAdapter";
import {
  type DateFilterHandle,
  SelectedDateBadge,
  applyDateDraftOnClose,
} from "./dateFilter";
import { FilterMenuSearchProvider } from "./filterMenuSearch";
import FilterRenderer from "./filterRenderer";
import { useFilterSurface } from "./filterSurface";
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
  trigger?: React.ReactElement;
  finalFocus?: boolean;
  /** Shows the picker header with a back button (e.g. to the field list). */
  onBack?: () => void;
  /** Shows the picker header with a close button. */
  onClose?: () => void;
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
  trigger,
  finalFocus,
  onBack,
  onClose,
}: DomainFilterValueProps) {
  const { t } = useTranslation();
  const selected = toDomainValues(state, values);
  const { filter } = state;
  const dateDraftRef = useRef<DateFilterHandle>(null);
  const inDrawer = useFilterSurface() === "drawer";

  const picker = (
    <FilterRenderer
      activeFilter={filter.key}
      dateDraftRef={dateDraftRef}
      selectedFilters={{
        ...selectedFilters,
        [filter.key]: { ...state, selected },
      }}
      facilityId={facilityId}
      handleBack={onBack}
      handleClose={onClose}
      onFilterChange={(_, next) =>
        onChange(Array.isArray(next) ? next : [next])
      }
    />
  );

  // A drawer hosting the toolbar shows the picker in place of its other views.
  const menu = inDrawer ? (
    picker
  ) : (
    <DropdownMenu
      open={open}
      onOpenChange={(next, details) => {
        applyDateDraftOnClose(dateDraftRef, next, details);
        onOpenChange?.(next);
      }}
    >
      <DropdownMenuTrigger asChild>
        {trigger ?? (
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
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0"
        align="start"
        finalFocus={finalFocus}
        aria-label={t(filter.label)}
      >
        {picker}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return filter.type === "command" ||
    filter.type === "tag" ||
    filter.type === "department" ||
    filter.type === "care_team" ||
    filter.type === "facility_user" ||
    filter.type === "activity_definition" ? (
    <FilterMenuSearchProvider>{menu}</FilterMenuSearchProvider>
  ) : (
    menu
  );
}
