import { useTranslation } from "react-i18next";

import { FilterChoiceItem } from "./filterChoiceItem";
import FilterHeader from "./filterHeader";
import {
  FilterMenuList,
  FilterMenuSearch,
  useFilterMenuSearch,
} from "./filterMenuSearch";
import { FilterOptionIndicator } from "./filterOptionIndicator";
import {
  FilterMenuGroup,
  FilterMenuLabel,
  FilterMenuSeparator,
} from "./filterSurface";
import { FilterConfig, FilterOption, FilterValues } from "./utils/Utils";

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
  const selectedValues = new Set(selected);
  const selectedOptions: FilterOption[] = [];
  const availableOptions: FilterOption[] = [];
  for (const option of filter.options) {
    if (term && !t(option.label).toLowerCase().includes(term)) continue;
    if (selectedValues.has(option.value)) selectedOptions.push(option);
    else availableOptions.push(option);
  }

  const toggle = (value: string) =>
    onFilterChange(
      filter.key,
      !multiple
        ? [value]
        : selectedValues.has(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
    );

  const renderOption = (option: FilterOption) => (
    <FilterChoiceItem
      key={option.value}
      multiple={multiple}
      checked={selectedValues.has(option.value)}
      onChoose={() => toggle(option.value)}
    >
      {filter.showColorIndicators !== false && (
        <FilterOptionIndicator color={option.color} />
      )}
      <span className="truncate">{t(option.label)}</span>
    </FilterChoiceItem>
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
        {selectedOptions.length > 0 && (
          <FilterMenuGroup>
            <FilterMenuLabel>{t("selected")}</FilterMenuLabel>
            {selectedOptions.map(renderOption)}
          </FilterMenuGroup>
        )}
        {selectedOptions.length > 0 && availableOptions.length > 0 && (
          <FilterMenuSeparator />
        )}
        {availableOptions.map(renderOption)}
        {!selectedOptions.length && !availableOptions.length && (
          <div className="text-muted-foreground px-2 py-4 text-center text-sm">
            {t("no_results_found")}
          </div>
        )}
      </FilterMenuList>
    </div>
  );
}
