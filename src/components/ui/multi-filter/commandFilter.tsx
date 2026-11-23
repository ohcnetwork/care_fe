import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { FilterChoiceItem } from "./filterChoiceItem";
import FilterHeader from "./filterHeader";
import {
  FilterMenuList,
  FilterMenuSearch,
  useFilterMenuSearch,
} from "./filterMenuSearch";
import { FilterConfig, FilterValues } from "./utils/Utils";

/** Fixed option lists (status, priority) in the same menu as the domain pickers. */
export default function RenderCommandFilter({
  filter,
  selected,
  onFilterChange,
  handleBack,
  handleClose,
}: {
  filter: FilterConfig;
  selected: string[];
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
  handleClose?: () => void;
}) {
  const { t } = useTranslation();
  const { search } = useFilterMenuSearch();
  const multiple = filter.mode === "multi";
  const label = t(filter.label);
  const term = search.trim().toLowerCase();
  // Keep the configured order so rows don't move as they are toggled.
  const options = filter.options.filter(
    (option) => !term || t(option.label).toLowerCase().includes(term),
  );

  const toggle = (value: string) =>
    onFilterChange(
      filter.key,
      !multiple
        ? [value]
        : selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
    );

  return (
    <div>
      {(handleBack || handleClose) && (
        <FilterHeader
          label={label}
          icon={filter.icon}
          onBack={handleBack}
          onClose={handleClose}
        />
      )}
      <div className="border-b p-3">
        <FilterMenuSearch
          placeholder={t("filter_search_field", { fieldName: label })}
          onBack={handleBack}
        />
      </div>
      <FilterMenuList className="max-h-[30vh] overflow-y-auto p-3">
        {options.map((option) => (
          <FilterChoiceItem
            key={option.value}
            multiple={multiple}
            checked={selected.includes(option.value)}
            onChoose={() => toggle(option.value)}
          >
            {filter.showColorIndicators !== false && (
              <span
                aria-hidden="true"
                className={cn(
                  "size-3 shrink-0 rounded-full border",
                  option.color,
                )}
              />
            )}
            <span className="truncate">{t(option.label)}</span>
          </FilterChoiceItem>
        ))}
        {options.length === 0 && (
          <div className="text-muted-foreground px-2 py-4 text-center text-sm">
            {t("no_results_found")}
          </div>
        )}
      </FilterMenuList>
    </div>
  );
}
