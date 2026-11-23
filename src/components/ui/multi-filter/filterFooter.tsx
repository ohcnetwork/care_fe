import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/** Action row shared by filter pickers: selection hint, Clear and Done. */
function FilterFooter({
  multiple,
  hasSelection,
  onClear,
  onDone,
}: {
  multiple: boolean;
  hasSelection: boolean;
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
      <span className="min-w-0 flex-1 truncate px-2 text-sm text-muted-foreground">
        {t(multiple ? "filter_pick_one_or_more" : "filter_pick_one")}
      </span>
      {onClear && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          // Stays focusable so keyboard focus isn't dropped once the selection is cleared.
          focusableWhenDisabled
          disabled={!hasSelection}
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
