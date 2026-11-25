import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/**
 * Action row shared by filter pickers: selection summary, Clear and Done.
 * A picker that closes when a value is picked omits `onDone`, so it has no
 * Done; its header's close button closes it unchanged.
 */
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
  /** Omit for pickers that close when a value is picked. */
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  // Keep Done at the trailing edge, but first in the multi-select tab order.
  const doneButton = onDone && (
    <Button
      type="button"
      variant="primary"
      size="sm"
      className="order-last"
      onClick={onDone}
    >
      {t("done")}
    </Button>
  );
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
      {multiple && doneButton}
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
      {!multiple && doneButton}
    </div>
  );
}

export default FilterFooter;
