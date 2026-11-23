import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/** Action row shared by filter pickers: selection summary, Clear and Done. */
function FilterFooter({
  multiple,
  selectedCount,
  onClear,
  onDone,
}: {
  multiple: boolean;
  selectedCount: number;
  /** Omit for fields that can't be cleared. */
  onClear?: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="filter-footer"
      className="flex items-center gap-2 border-t p-2"
    >
      <span
        role={multiple ? "status" : undefined}
        className="min-w-0 flex-1 truncate px-2 text-sm text-muted-foreground"
      >
        {multiple
          ? t("selected_count", { count: selectedCount })
          : t("filter_pick_one")}
      </span>
      {onClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          // Stays focusable so keyboard focus isn't dropped once the selection is cleared.
          focusableWhenDisabled
          disabled={selectedCount === 0}
          className="text-muted-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
          onClick={onClear}
        >
          {t("clear")}
        </Button>
      )}
      <Button type="button" variant="primary" size="sm" onClick={onDone}>
        {t("done")}
      </Button>
    </div>
  );
}

export default FilterFooter;
